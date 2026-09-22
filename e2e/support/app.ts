import { spawn, ChromeProcess } from './sandbox';
import { chromium, Browser, Page } from 'playwright-core';

export { spawn as startSandbox };
export type { ChromeProcess };

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface App {
    browser: Browser,
    page: Page,
    url: string,
    close: () => Promise<void>
}

export async function openApp(url: string): Promise<App> {
    const browser = await chromium.launch({ channel: process.env.PRIVTHING_E2E_CHANNEL || 'chrome' });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(url);
    await page.evaluate(() => localStorage.setItem('privthing.isIntroduced', btoa(encodeURIComponent(JSON.stringify(true)))));
    await page.reload();
    await page.locator('.listItem').first().waitFor();
    return {
        browser: browser,
        page: page,
        url: url,
        close: () => browser.close()
    }
}

export const storedDrafts = (page: Page) => page.evaluate(() => new Promise<{ path: string, note: string }[]>((resolve) => {
    const request = indexedDB.open('privthing-drafts');
    request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('drafts')) {
            return resolve([])
        }
        const all = db.transaction('drafts').objectStore('drafts').getAll();
        all.onsuccess = () => resolve(all.result.map((draft: { path: string, note: string }) => ({ path: draft.path.split('/').pop() || '', note: draft.note })));
    };
    request.onerror = () => resolve([]);
}));

export const openRow = async (page: Page, name: string) => {
    await page.locator(`.listItem[aria-label="${name}"]`).click();
    await sleep(700);
};

export const editorText = (page: Page) => page.locator('.cm-content').first().innerText();

export const typeAtEnd = async (page: Page, text: string) => {
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(text);
};

export const draftPromptVisible = (page: Page) => page.getByText('Unsaved draft found').isVisible().catch(() => false);

export const unsavedMarkerShown = async (page: Page) => (await page.locator('.unsavedMarker').count()) > 0;

export const fieldValue = (page: Page, name: string) => page.locator(`input[name="${name}"]`).first().inputValue();
