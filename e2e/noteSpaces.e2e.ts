import { App, ChromeProcess, editorText, openApp, openRow, sleep, startSandbox } from './support/app';

let sandbox: ChromeProcess;
let app: App;

beforeAll(async () => {
    sandbox = await startSandbox({ 'a.txt': 'alpha\n' });
    app = await openApp(sandbox.url);
});

afterAll(async () => {
    await app?.close();
    sandbox?.stop();
});

describe('closing a note space', () => {
    it('asks before closing a pane with unsaved changes, and keeps it on No', async () => {
        const { page } = app;
        await openRow(page, 'a.txt');
        await page.locator('[aria-label="New note space"]').click();
        await sleep(500);
        expect(await page.locator('.noteSpaceContainer').count()).toBe(2);

        await page.locator('.noteSpaceContainer').nth(1).locator('.cm-content').click();
        await page.keyboard.type('unsaved words');
        await sleep(300);
        await page.locator('.noteSpaceContainer').nth(1).locator('[aria-label="Close note space"]').click();
        await sleep(400);

        expect(await page.getByText('There are unsaved changes').isVisible()).toBe(true);
        await page.getByRole('button', { name: 'No', exact: true }).click();
        await sleep(400);
        expect(await page.locator('.noteSpaceContainer').count()).toBe(2);
        expect(await page.locator('.noteSpaceContainer').nth(1).locator('.cm-content').innerText()).toContain('unsaved words');

        await page.locator('.noteSpaceContainer').nth(1).locator('[aria-label="Close note space"]').click();
        await sleep(400);
        await page.getByRole('button', { name: 'Yes', exact: true }).click();
        await sleep(400);
        expect(await page.locator('.noteSpaceContainer').count()).toBe(1);
        expect(await editorText(page)).toContain('alpha');
    });

    it('closes a clean pane without asking', async () => {
        const { page } = app;
        await page.locator('[aria-label="New note space"]').click();
        await sleep(500);
        await page.locator('.noteSpaceContainer').nth(1).locator('[aria-label="Close note space"]').click();
        await sleep(400);
        expect(await page.getByText('There are unsaved changes').isVisible().catch(() => false)).toBe(false);
        expect(await page.locator('.noteSpaceContainer').count()).toBe(1);
    });
});
