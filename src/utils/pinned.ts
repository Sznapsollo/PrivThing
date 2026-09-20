import { retrieveLocalStorage, saveLocalStorage } from './utils';

const PINNED_KEY = 'privthing.pmPinned';

export function getPinnedPaths(): string[] {
    const stored = retrieveLocalStorage(PINNED_KEY);
    return Array.isArray(stored) ? stored : []
}

export function isPinned(path?: string): boolean {
    return !!path && getPinnedPaths().includes(path)
}

export function togglePinned(path?: string): boolean {
    if (!path) {
        return false
    }

    const pinned = getPinnedPaths();
    const next = pinned.includes(path) ? pinned.filter((pinnedPath) => pinnedPath !== path) : [...pinned, path];
    saveLocalStorage(PINNED_KEY, next);

    return next.includes(path)
}

export function sortPinnedFirst<T extends { path: string }>(items: T[]): T[] {
    const pinned = getPinnedPaths();
    if (!pinned.length) {
        return items
    }

    const isItemPinned = (item: T) => pinned.includes(item.path);
    return [...items].sort((first, second) => Number(isItemPinned(second)) - Number(isItemPinned(first)))
}
