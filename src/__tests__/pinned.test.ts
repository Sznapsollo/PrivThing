import { getPinnedPaths, isPinned, sortPinnedFirst, togglePinned } from '../utils/pinned';

beforeEach(() => window.localStorage.clear());

describe('pinning an item', () => {
    it('starts with nothing pinned', () => {
        expect(getPinnedPaths()).toEqual([]);
        expect(isPinned('localStorage/a.txt')).toBe(false);
    });

    it('pins and unpins the same path', () => {
        expect(togglePinned('localStorage/a.txt')).toBe(true);
        expect(isPinned('localStorage/a.txt')).toBe(true);

        expect(togglePinned('localStorage/a.txt')).toBe(false);
        expect(isPinned('localStorage/a.txt')).toBe(false);
    });

    it('ignores an item with no path', () => {
        expect(togglePinned(undefined)).toBe(false);
        expect(getPinnedPaths()).toEqual([]);
    });

    it('survives a reload, because it lives in localStorage', () => {
        togglePinned('localStorage/a.txt');
        expect(getPinnedPaths()).toEqual(['localStorage/a.txt']);
    });
});

describe('sorting pinned items first', () => {
    const items = [
        { name: 'a.txt', path: 'localStorage/a.txt' },
        { name: 'b.txt', path: 'localStorage/b.txt' },
        { name: 'c.txt', path: 'localStorage/c.txt' }
    ];

    it('leaves the order alone when nothing is pinned', () => {
        expect(sortPinnedFirst(items).map((item) => item.name)).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });

    it('lifts a pinned item to the top', () => {
        togglePinned('localStorage/c.txt');
        expect(sortPinnedFirst(items).map((item) => item.name)).toEqual(['c.txt', 'a.txt', 'b.txt']);
    });

    it('keeps the existing order within the pinned group and within the rest', () => {
        togglePinned('localStorage/c.txt');
        togglePinned('localStorage/a.txt');
        expect(sortPinnedFirst(items).map((item) => item.name)).toEqual(['a.txt', 'c.txt', 'b.txt']);
    });

    it('does not modify the array it was given', () => {
        togglePinned('localStorage/c.txt');
        sortPinnedFirst(items);
        expect(items.map((item) => item.name)).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });
});
