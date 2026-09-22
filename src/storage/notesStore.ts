import { createStore, del, entries, get, set, setMany } from 'idb-keyval';
import { removeLocalStorage, retrieveLocalStorage, saveLocalStorage } from '../utils/utils';

export interface NoteRecord {
    data: string,
    lastModified: number,
    size: number
}

export const LEGACY_FILES_KEY = 'privthing.files';
export const MIGRATED_FLAG = 'privthing.notesMigratedToIdb';

const store = createStore('privthing', 'notes');

let ready: Promise<void> | null = null;

const migrate = async (): Promise<void> => {
    try {
        if (retrieveLocalStorage(MIGRATED_FLAG) === true) {
            return
        }

        const legacyNotes = retrieveLocalStorage(LEGACY_FILES_KEY);
        if (legacyNotes && typeof legacyNotes === 'object') {
            const records: [string, NoteRecord][] = Object.keys(legacyNotes)
                .filter((name) => legacyNotes[name] && legacyNotes[name].data != null)
                .map((name) => [name, {
                    data: legacyNotes[name].data,
                    lastModified: legacyNotes[name].lastModified || new Date().getTime(),
                    size: legacyNotes[name].size || String(legacyNotes[name].data).length
                }]);

            if (records.length) {
                await setMany(records, store);

                const migrated = await entries(store);
                if (migrated.length < records.length) {
                    console.warn('Notes migration incomplete, keeping localStorage as it is');
                    return
                }
            }
        }

        saveLocalStorage(MIGRATED_FLAG, true);
    } catch (e) {
        console.warn('Notes migration failed, falling back to localStorage', e);
        throw e
    }
};

const ensureReady = (): Promise<void> => {
    if (!ready) {
        ready = migrate().catch((e) => {
            ready = null;
            throw e
        });
    }
    return ready
};

export async function getNote(name: string): Promise<NoteRecord | undefined> {
    await ensureReady();
    return await get<NoteRecord>(name, store)
}

export async function setNote(name: string, record: NoteRecord): Promise<void> {
    await ensureReady();
    await set(name, record, store);
}

export async function removeNote(name: string): Promise<void> {
    await ensureReady();
    await del(name, store);
}

export async function allNotes(): Promise<Record<string, NoteRecord>> {
    await ensureReady();
    const stored = await entries<string, NoteRecord>(store);
    return stored.reduce((notes: Record<string, NoteRecord>, [name, record]) => {
        notes[name] = record;
        return notes
    }, {})
}

export async function setNotes(records: Record<string, NoteRecord>): Promise<void> {
    await ensureReady();
    await setMany(Object.keys(records).map((name) => [name, records[name]]), store);
}

export function legacyBackupSize(): number | null {
    try {
        const raw = window.localStorage?.getItem(LEGACY_FILES_KEY);
        return raw == null ? null : raw.length
    } catch (e) {
        return null
    }
}

export function removeLegacyBackup(): void {
    removeLocalStorage(LEGACY_FILES_KEY);
}
