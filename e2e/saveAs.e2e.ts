import { App, ChromeProcess, draftPromptVisible, editorText, fieldValue, openApp, sleep, startSandbox, typeAtEnd, unsavedMarkerShown } from './support/app';

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

const newNote = async (text: string) => {
    const { page } = app;
    await page.locator('[aria-label="New Tab"]').first().click();
    await sleep(500);
    await page.locator('.cm-content').first().click();
    await page.keyboard.type(text);
    await sleep(300);
    await page.locator('button:has-text("Save As")').first().click();
    await sleep(500);
};

describe('Save As in the running app', () => {
    it('saving a new note to local storage reopens it in the pane, and Ctrl+S then saves there', async () => {
        const { page } = app;
        await newNote('fresh note body');
        await page.locator('input[name="fileName"]').fill('fresh.txt');
        await page.locator('select[name="saveAsType"]').selectOption('LOCAL_STORAGE');
        await page.locator('.modal-footer button:has-text("Save")').click();
        await sleep(1500);

        expect(await fieldValue(page, 'filePath')).toBe('localStorage/fresh.txt');
        expect(await page.locator('[role="tab"]').allInnerTexts()).toContainEqual(expect.stringContaining('fresh.txt'));
        expect(await unsavedMarkerShown(page)).toBe(false);
        expect(await draftPromptVisible(page)).toBe(false);

        await typeAtEnd(page, ' MORE');
        await sleep(200);
        await page.keyboard.press('Control+s');
        await sleep(800);
        expect(await unsavedMarkerShown(page)).toBe(false);
        expect(await editorText(page)).toBe('fresh note body MORE');
    });

    it('saving with a password reopens the note already unlocked', async () => {
        const { page } = app;
        await newNote('top secret');
        await page.locator('input[name="fileName"]').fill('vault');
        await page.locator('select[name="saveAsType"]').selectOption('LOCAL_STORAGE');
        await page.locator('label[for="encryptDataChbx"]').click();
        await page.locator('.modal input[name="secretValue"]').fill('hunter22');
        await page.locator('.modal input[name="secretValueConfirm"]').fill('hunter22');
        await page.locator('.modal button:has-text("Go")').click();
        await sleep(2500);

        expect(await fieldValue(page, 'filePath')).toBe('localStorage/vault.prvthng');
        expect(await page.locator('.secretPane').count()).toBe(0);
        expect(await editorText(page)).toBe('top secret');
        expect(await draftPromptVisible(page)).toBe(false);
    });
});
