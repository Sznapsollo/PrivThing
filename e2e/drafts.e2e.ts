import { App, ChromeProcess, draftPromptVisible, editorText, openApp, openRow, sleep, startSandbox, storedDrafts, typeAtEnd, unsavedMarkerShown } from './support/app';

let sandbox: ChromeProcess;
let app: App;

beforeAll(async () => {
    sandbox = await startSandbox({ 'a.txt': 'alpha line 1\nalpha line 2\n', 'b.txt': 'bravo line 1\nbravo line 2\n' });
    app = await openApp(sandbox.url);
});

afterAll(async () => {
    await app?.close();
    sandbox?.stop();
});

describe('crash-safe drafts in the running app', () => {
    it('a save right after typing leaves no draft, and opening another note offers nothing', async () => {
        const { page } = app;
        await openRow(page, 'a.txt');
        await typeAtEnd(page, ' EDIT1');
        await sleep(300);
        await page.keyboard.press('Control+s');
        await sleep(600);
        expect(await unsavedMarkerShown(page)).toBe(false);

        await sleep(2000);
        expect(await storedDrafts(page)).toEqual([]);

        await openRow(page, 'b.txt');
        await sleep(800);
        expect(await draftPromptVisible(page)).toBe(false);
        expect(await editorText(page)).toContain('bravo line 1');
    });

    it('a draft survives a reload, is offered, and restoring then saving clears it', async () => {
        const { page } = app;
        await typeAtEnd(page, ' DRAFT2');
        await sleep(2500);
        expect(await storedDrafts(page)).toEqual([{ path: 'b.txt', note: 'bravo line 1\nbravo line 2\n DRAFT2' }]);

        await page.reload();
        await sleep(2500);
        expect(await draftPromptVisible(page)).toBe(true);
        expect(await editorText(page)).not.toContain('DRAFT2');

        await page.getByRole('button', { name: 'Restore draft' }).click();
        await sleep(500);
        expect(await editorText(page)).toContain('DRAFT2');
        expect(await unsavedMarkerShown(page)).toBe(true);

        await page.keyboard.press('Control+s');
        await sleep(800);
        expect(await unsavedMarkerShown(page)).toBe(false);
        expect(await storedDrafts(page)).toEqual([]);
    });

    it('a save after the debounce leaves no draft either', async () => {
        const { page } = app;
        await openRow(page, 'a.txt');
        await typeAtEnd(page, ' EDIT3');
        await sleep(2000);
        await page.keyboard.press('Control+s');
        await sleep(2500);
        expect(await storedDrafts(page)).toEqual([]);

        await openRow(page, 'b.txt');
        await sleep(800);
        expect(await draftPromptVisible(page)).toBe(false);
    });
});
