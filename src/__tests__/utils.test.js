import { manageEditItemSpaces, manageHeaderTabs, toPersistable, saveLocalStorage, retrieveLocalStorage } from '../utils/utils';

describe('toPersistable', () => {
    it('drops rawNote so a picked file body never reaches storage', () => {
        const item = { name: 'secret.txt', path: '/tmp/secret.txt', size: 12, rawNote: 'FILE BODY', tabId: 'abc', isActive: true };
        const persisted = toPersistable(item);
        expect(persisted.rawNote).toBeUndefined();
        expect(JSON.stringify([persisted])).not.toContain('FILE BODY');
    });

    it('keeps every other field and does not touch the source', () => {
        const item = { name: 'a.txt', path: '/a.txt', size: 3, rawNote: 'x', tabId: 'id1', isActive: false, scrollTop: 40 };
        expect(toPersistable(item)).toEqual({ name: 'a.txt', path: '/a.txt', size: 3, tabId: 'id1', isActive: false, scrollTop: 40 });
        expect(item.rawNote).toBe('x');
    });

    it('passes null and undefined through', () => {
        expect(toPersistable(null)).toBeNull();
        expect(toPersistable(undefined)).toBeUndefined();
    });
});

describe('saveLocalStorage', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        window.localStorage.clear();
    });

    it('returns true and round-trips through retrieveLocalStorage', () => {
        expect(saveLocalStorage('privthing.test', { a: 1, b: 'ą' })).toBe(true);
        expect(retrieveLocalStorage('privthing.test')).toEqual({ a: 1, b: 'ą' });
    });

    it('returns false when the quota is exceeded instead of reporting success', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            const error = new Error('quota');
            error.name = 'QuotaExceededError';
            throw error
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(saveLocalStorage('privthing.files', { note: 'x' })).toBe(false);
    });
});

describe('manageHeaderTabs', () => {
    it('opens the first tab and gives it an id', () => {
        const tabs = manageHeaderTabs([], { name: 'a.txt', path: '/a.txt' }, null, 'CHANGE_ACTIVE');
        expect(tabs).toHaveLength(1);
        expect(tabs[0].isActive).toBe(true);
        expect(tabs[0].tabId).toHaveLength(10);
    });

    it('reuses the tab that already holds the same path', () => {
        let tabs = manageHeaderTabs([], { name: 'a.txt', path: '/a.txt' }, null, 'CHANGE_ACTIVE');
        tabs = manageHeaderTabs(tabs, { name: 'b.txt', path: '/b.txt' }, { path: '/b.txt', isNew: true }, 'CHANGE_ACTIVE');
        const reopened = manageHeaderTabs(tabs, { name: 'a.txt', path: '/a.txt' }, { path: '/a.txt', isNew: true }, 'CHANGE_ACTIVE');
        expect(reopened).toHaveLength(2);
        expect(reopened.find((tab) => tab.path === '/a.txt').isActive).toBe(true);
        expect(reopened.filter((tab) => tab.isActive)).toHaveLength(1);
    });

    it('keeps the tab id and remembered scroll when the same tab is refreshed', () => {
        let tabs = manageHeaderTabs([], { name: 'a.txt', path: '/a.txt' }, null, 'CHANGE_ACTIVE');
        tabs[0].scrollTop = 120;
        const tabId = tabs[0].tabId;
        const updated = manageHeaderTabs(tabs, { name: 'a.txt', path: '/a.txt' }, { tabId: tabId }, 'CHANGE_ACTIVE');
        expect(updated[0].tabId).toBe(tabId);
        expect(updated[0].scrollTop).toBe(120);
    });
});

describe('manageEditItemSpaces', () => {
    it('creates a space when there is none', () => {
        const spaces = manageEditItemSpaces([], { name: 'a.txt', path: '/a.txt' });
        expect(spaces).toHaveLength(1);
        expect(spaces[0].name).toBe('a.txt');
        expect(spaces[0].isActive).toBe(true);
    });

    it('replaces only the active space and keeps the others flexed', () => {
        const spaces = manageEditItemSpaces(
            [{ name: 'a.txt', path: '/a.txt', isActive: false, flex: 2 }, { name: 'b.txt', path: '/b.txt', isActive: true, flex: 3 }],
            { name: 'c.txt', path: '/c.txt' }
        );
        expect(spaces.map((space) => space.name)).toEqual(['a.txt', 'c.txt']);
        expect(spaces[1].flex).toBe(3);
        expect(spaces.filter((space) => space.isActive)).toHaveLength(1);
    });
});

describe('date helpers (moment replacements)', () => {
    const { fileNameTimestamp, durationClock, formatUtcDateTime } = require('../utils/dates');

    it('builds the same filename shape moment produced', () => {
        expect(fileNameTimestamp(new Date(2026, 8, 20, 13, 5, 7))).toBe('September_20th_2026_1_05_07');
        expect(fileNameTimestamp(new Date(2026, 0, 1, 0, 0, 0))).toBe('January_1st_2026_12_00_00');
        expect(fileNameTimestamp(new Date(2026, 0, 2, 9, 0, 0))).toBe('January_2nd_2026_9_00_00');
        expect(fileNameTimestamp(new Date(2026, 0, 3, 9, 0, 0))).toBe('January_3rd_2026_9_00_00');
        expect(fileNameTimestamp(new Date(2026, 0, 11, 9, 0, 0))).toBe('January_11th_2026_9_00_00');
    });

    it('formats a duration as a clock', () => {
        expect(durationClock(120000)).toBe('00:02:00');
        expect(durationClock(3661000)).toBe('01:01:01');
        expect(durationClock(65000, false)).toBe('01:05');
        expect(durationClock(0)).toBe('00:00:00');
        expect(durationClock(undefined)).toBe('00:00:00');
    });

    it('formats a timestamp in UTC, as moment.utc did', () => {
        expect(formatUtcDateTime(Date.UTC(2026, 8, 20, 13, 5, 7))).toBe('2026-09-20 13:05:07');
    });
});
