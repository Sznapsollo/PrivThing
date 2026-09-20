import { clear, createStore, del, entries, get, set } from 'idb-keyval';
import { allNotes, getNote, NoteRecord, setNote } from './notesStore';

export interface TrashedNote extends NoteRecord {
    deletedAt: number,
    name: string
}

const TRASH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const store = createStore('privthing-trash', 'trash');

export function freeNoteName(name: string, taken: string[]): string {
    if (!taken.includes(name)) {
        return name
    }

    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.substring(0, dot) : name;
    const extension = dot > 0 ? name.substring(dot) : '';

    let candidate = base + ' (restored)' + extension;
    let counter = 2;
    while (taken.includes(candidate)) {
        candidate = base + ' (restored ' + counter + ')' + extension;
        counter++;
    }

    return candidate
}

export async function sweepTrash(): Promise<number> {
    const stored = await entries<string, TrashedNote>(store);
    const oldest = new Date().getTime() - TRASH_MAX_AGE;
    let removed = 0;

    for (const [name, trashed] of stored) {
        if (trashed.deletedAt > oldest) {
            continue
        }
        await del(name, store);
        removed++;
    }

    return removed
}

export async function trashNote(name: string): Promise<void> {
    const record = await getNote(name);
    if (!record) {
        return
    }

    await set(name, { ...record, name: name, deletedAt: new Date().getTime() }, store);
}

export async function listTrash(): Promise<TrashedNote[]> {
    await sweepTrash();
    const stored = await entries<string, TrashedNote>(store);
    return stored
        .map(([, trashed]) => trashed)
        .sort((first, second) => second.deletedAt - first.deletedAt)
}

export async function restoreTrashedNote(name: string): Promise<string | null> {
    const trashed = await get<TrashedNote>(name, store);
    if (!trashed) {
        return null
    }

    const taken = Object.keys(await allNotes());
    const restoredName = freeNoteName(name, taken);

    await setNote(restoredName, {
        data: trashed.data,
        lastModified: trashed.lastModified,
        size: trashed.size
    });
    await del(name, store);

    return restoredName
}

export async function deleteTrashedNote(name: string): Promise<void> {
    await del(name, store);
}

export async function emptyTrash(): Promise<void> {
    await clear(store);
}
