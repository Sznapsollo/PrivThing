import {
    applyAppTheme,
    nextAppTheme,
    resolveAppTheme,
    watchSystemTheme,
    APP_THEME_DARK,
    APP_THEME_LIGHT,
    APP_THEME_SYSTEM
} from '../utils/appTheme';

const fakeSystem = (dark: boolean) => {
    const listeners: (() => void)[] = [];
    const query = {
        matches: dark,
        addEventListener: (_: string, listener: () => void) => { listeners.push(listener) },
        removeEventListener: (_: string, listener: () => void) => {
            const at = listeners.indexOf(listener);
            if (at >= 0) { listeners.splice(at, 1) }
        }
    };
    Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: () => query });
    return {
        query: query,
        listenerCount: () => listeners.length,
        change: (nowDark: boolean) => {
            query.matches = nowDark;
            listeners.forEach((listener) => listener());
        }
    }
};

afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: undefined });
});

describe('applying the app theme', () => {
    it('marks the document dark and tells Bootstrap about it', () => {
        expect(applyAppTheme(APP_THEME_DARK)).toBe(true);
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
        expect(document.documentElement.classList.contains('appDark')).toBe(true);
    });

    it('goes back to light', () => {
        applyAppTheme(APP_THEME_DARK);
        expect(applyAppTheme(APP_THEME_LIGHT)).toBe(false);
        expect(document.documentElement.classList.contains('appDark')).toBe(false);
    });

    it('treats a missing or unknown setting as follow-the-system, which is the default', () => {
        fakeSystem(true);
        expect(applyAppTheme(undefined)).toBe(true);
        expect(applyAppTheme('SOMETHING_ELSE')).toBe(true);

        fakeSystem(false);
        expect(applyAppTheme(undefined)).toBe(false);
    });
});

describe('following the system', () => {
    it('reads the system preference when set to SYSTEM', () => {
        fakeSystem(true);
        expect(resolveAppTheme(APP_THEME_SYSTEM)).toBe('dark');

        fakeSystem(false);
        expect(resolveAppTheme(APP_THEME_SYSTEM)).toBe('light');
    });

    it('ignores the system preference for an explicit choice', () => {
        fakeSystem(true);
        expect(resolveAppTheme(APP_THEME_LIGHT)).toBe('light');
        expect(resolveAppTheme(APP_THEME_DARK)).toBe('dark');
    });

    it('re-applies when the system flips while the app is open', () => {
        const system = fakeSystem(false);
        applyAppTheme(APP_THEME_SYSTEM);
        expect(document.documentElement.classList.contains('appDark')).toBe(false);

        const stop = watchSystemTheme(() => applyAppTheme(APP_THEME_SYSTEM));
        system.change(true);
        expect(document.documentElement.classList.contains('appDark')).toBe(true);

        stop();
        expect(system.listenerCount()).toBe(0);
    });

    it('falls back to light where matchMedia is missing', () => {
        expect(resolveAppTheme(APP_THEME_SYSTEM)).toBe('light');
        expect(resolveAppTheme(undefined)).toBe('light');
        expect(watchSystemTheme(() => {})).toBeInstanceOf(Function);
        expect(() => watchSystemTheme(() => {})()).not.toThrow();
    });
});

describe('the header toggle', () => {
    it('cycles light to dark to system and back', () => {
        expect(nextAppTheme(APP_THEME_LIGHT)).toBe(APP_THEME_DARK);
        expect(nextAppTheme(APP_THEME_DARK)).toBe(APP_THEME_SYSTEM);
        expect(nextAppTheme(APP_THEME_SYSTEM)).toBe(APP_THEME_LIGHT);
    });

    it('starts from system when nothing has been chosen yet, so the first click is an explicit light', () => {
        expect(nextAppTheme(undefined)).toBe(APP_THEME_LIGHT);
    });
});

describe('the shipped default', () => {
    it('is follow-the-system', async () => {
        const { settingsInitialStateBaseline } = await import('../context/Context');
        expect(settingsInitialStateBaseline.appTheme).toBe(APP_THEME_SYSTEM);
    });
});
