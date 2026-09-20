export const APP_THEME_LIGHT = 'LIGHT';
export const APP_THEME_DARK = 'DARK';
export const APP_THEME_SYSTEM = 'SYSTEM';

export const APP_THEMES = [APP_THEME_LIGHT, APP_THEME_DARK, APP_THEME_SYSTEM];

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function systemPrefersDark(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false
    }
    return window.matchMedia(DARK_SCHEME_QUERY).matches
}

export function resolveAppTheme(appTheme?: string): 'light' | 'dark' {
    if (appTheme === APP_THEME_DARK) {
        return 'dark'
    }
    if (appTheme === APP_THEME_LIGHT) {
        return 'light'
    }
    return systemPrefersDark() ? 'dark' : 'light'
}

export function applyAppTheme(appTheme?: string): boolean {
    const dark = resolveAppTheme(appTheme) === 'dark';
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('appDark', dark);
    return dark
}

export function watchSystemTheme(onChange: () => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
    }

    const query = window.matchMedia(DARK_SCHEME_QUERY);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange)
}

export function isSystemAppTheme(appTheme?: string): boolean {
    return appTheme !== APP_THEME_LIGHT && appTheme !== APP_THEME_DARK
}

export function nextAppTheme(appTheme?: string): string {
    const current = APP_THEMES.indexOf(appTheme || APP_THEME_SYSTEM);
    return APP_THEMES[(current + 1) % APP_THEMES.length]
}
