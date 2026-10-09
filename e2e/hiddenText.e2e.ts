import { Page } from 'playwright-core';
import { App, ChromeProcess, openApp, openRow, sleep, startSandbox } from './support/app';

let sandbox: ChromeProcess;
let app: App;

const panes = (page: Page) => page.locator('.noteSpaceContainer');
const paneFlex = (page: Page, index: number) => panes(page).nth(index).evaluate((el) => (el as HTMLElement).style.flex);
const paneActive = (page: Page, index: number) => panes(page).nth(index).locator('.editItemSpace').evaluate((el) => el.classList.contains('isActive'));
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const hidden = (page: Page, index: number) => panes(page).nth(index).locator('.cm-pass-hider').first();
const paneText = (page: Page, index: number) => panes(page).nth(index).locator('.cm-content').innerText();

beforeAll(async () => {
    sandbox = await startSandbox({ 'a.txt': 'alpha\n', 'b.txt': 'login: bob\npass: hide[[s3cret]]\n', 'long.txt': Array.from({ length: 200 }, (_, i) => `line ${i} word`).join('\n') });
    app = await openApp(sandbox.url);
    await app.page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: sandbox.url });
    await app.page.evaluate(() => localStorage.setItem('privthing.pmSettings', btoa(encodeURIComponent(JSON.stringify({ stretchNoteSpaceOnActive: true })))));
    await app.page.reload();
    await app.page.locator('.listItem').first().waitFor();

    const { page } = app;
    await openRow(page, 'a.txt');
    await page.locator('[aria-label="New note space"]').click();
    await sleep(500);
    await openRow(page, 'b.txt');
    await panes(page).nth(0).locator('.editItemSpace').click();
    await sleep(500);
});

afterAll(async () => {
    await app?.close();
    sandbox?.stop();
});

describe('hidden text', () => {
    it('clicking hidden text in an inactive pane copies it without activating or stretching that pane', async () => {
        const { page } = app;
        expect(await paneActive(page, 0)).toBe(true);
        const flexBefore = [await paneFlex(page, 0), await paneFlex(page, 1)];
        await page.evaluate(() => navigator.clipboard.writeText('nothing'));

        await hidden(page, 1).click();
        await sleep(500);

        expect(await clipboard(page)).toBe('s3cret');
        expect(await paneActive(page, 0)).toBe(true);
        expect(await paneActive(page, 1)).toBe(false);
        expect([await paneFlex(page, 0), await paneFlex(page, 1)]).toEqual(flexBefore);
    });

    it('copies on every click, also in the active pane', async () => {
        const { page } = app;
        await panes(page).nth(1).locator('.editItemSpace').click();
        await sleep(500);
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => navigator.clipboard.writeText('nothing'));
            await hidden(page, 1).click();
            await sleep(300);
            expect(await clipboard(page)).toBe('s3cret');
        }
    });

    it('right click offers the hidden text actions', async () => {
        const { page } = app;
        await hidden(page, 1).click({ button: 'right' });
        await sleep(300);
        expect(await page.getByRole('menuitem', { name: 'Show for a moment hidden text' }).isVisible()).toBe(true);
        expect(await page.getByRole('menuitem', { name: 'Unhide hidden text' }).isVisible()).toBe(true);
    });

    it('shows the hidden text for a moment', async () => {
        const { page } = app;
        await page.getByRole('menuitem', { name: 'Show for a moment hidden text' }).click();
        await sleep(600);
        expect(await paneText(page, 1)).toContain('s3cret');
        await sleep(5500);
        expect(await paneText(page, 1)).not.toContain('s3cret');
    });

    it('unhides the right text after the lines above it changed', async () => {
        const { page } = app;
        await panes(page).nth(1).locator('.cm-line').first().click();
        await page.keyboard.press('Home');
        await page.keyboard.type('user ');
        await sleep(300);
        await hidden(page, 1).click({ button: 'right' });
        await sleep(300);
        await page.getByRole('menuitem', { name: 'Unhide hidden text' }).click();
        await sleep(400);
        expect(await paneText(page, 1)).toContain('pass: s3cret');
        expect(await paneText(page, 1)).toContain('user login: bob');
        expect(await panes(page).nth(1).locator('.cm-pass-hider').count()).toBe(0);
    });

    it('hiding and unhiding text keeps the scroll position', async () => {
        const { page } = app;
        await panes(page).nth(1).locator('.cm-content').click();
        await page.keyboard.press('Control+s');
        await sleep(600);
        await openRow(page, 'long.txt');
        expect(await paneText(page, 1)).toContain('line 0 word');
        const scroller = panes(page).nth(1).locator('.cm-scroller');
        const scrollTop = () => scroller.evaluate((el) => Math.round(el.scrollTop));
        const word = panes(page).nth(1).locator('.cm-line', { hasText: 'line 70 word' }).first();
        await scroller.evaluate((el) => el.scrollTo({ top: 1500 }));
        await sleep(400);
        await word.scrollIntoViewIfNeeded();
        await sleep(400);
        const before = await scrollTop();
        expect(before).toBeGreaterThan(500);

        await word.dblclick({ position: { x: 5, y: 5 } });
        await word.click({ button: 'right', position: { x: 5, y: 5 } });
        await sleep(300);
        await page.getByRole('menuitem', { name: 'Hide selected text' }).click();
        await sleep(500);
        expect(await panes(page).nth(1).locator('.cm-pass-hider').count()).toBeGreaterThan(0);
        expect(await scrollTop()).toBe(before);

        await panes(page).nth(1).locator('.cm-pass-hider').first().click({ button: 'right' });
        await sleep(300);
        await page.getByRole('menuitem', { name: 'Unhide hidden text' }).click();
        await sleep(500);
        expect(await panes(page).nth(1).locator('.cm-pass-hider').count()).toBe(0);
        expect(await scrollTop()).toBe(before);
    });

    it('deleting a line removes just that line and keeps the scroll position', async () => {
        const { page } = app;
        const scroller = panes(page).nth(1).locator('.cm-scroller');
        const before = await scroller.evaluate((el) => Math.round(el.scrollTop));
        const line = panes(page).nth(1).locator('.cm-line', { hasText: 'line 72 word' }).first();
        await line.click({ position: { x: 5, y: 5 } });
        await line.click({ button: 'right', position: { x: 5, y: 5 } });
        await sleep(300);
        await page.getByRole('menuitem', { name: /^Delete line/ }).click();
        await sleep(500);
        const text = await panes(page).nth(1).evaluate(() => (document.querySelectorAll('.noteSpaceContainer')[1].querySelector('.cm-content') as HTMLElement).innerText);
        expect(text).toContain('line 71 word\nline 73 word');
        expect(await scroller.evaluate((el) => Math.round(el.scrollTop))).toBe(before);
    });
});
