import { getProvider, localStorageItem, StorageError } from '../storage';
import * as notesStore from '../storage/notesStore';
import { Item } from '../model';

beforeEach(async () => {
    const stored = await notesStore.allNotes();
    for (const name of Object.keys(stored)) {
        await notesStore.removeNote(name);
    }
    window.localStorage.clear();
    jest.resetModules();
});

const lsItem = (name: string): Item => localStorageItem(name);
const serverItem = (path: string): Item => ({ name: 'note.txt', path: path, fetchData: true });
const pickedItem = (content: string): Item => ({ name: 'picked.txt', path: '', rawNote: content });

describe('choosing a provider', () => {
    it('routes each kind of item to its own backend', () => {
        expect(getProvider(lsItem('a.txt')).kind).toBe('localStorage');
        expect(getProvider(serverItem('/tmp/a.txt')).kind).toBe('server');
        expect(getProvider(pickedItem('hello')).kind).toBe('pickedFile');
    });

    it('says what each backend can do', () => {
        expect(getProvider(lsItem('a.txt')).canWrite).toBe(true);
        expect(getProvider(lsItem('a.txt')).canDelete).toBe(true);
        expect(getProvider(serverItem('/tmp/a.txt')).canWrite).toBe(true);
        expect(getProvider(serverItem('/tmp/a.txt')).canDelete).toBe(false);
        expect(getProvider(pickedItem('hello')).canWrite).toBe(false);
        expect(getProvider(pickedItem('hello')).canDelete).toBe(false);
    });
});

describe('the localStorage backend', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        window.localStorage.clear();
    });

    it('writes a note and reads it back', async () => {
        const provider = getProvider(lsItem('a.txt'));
        await provider.write(lsItem('a.txt'), 'hello');
        expect(await provider.read(lsItem('a.txt'))).toEqual({ data: 'hello', found: true });
    });

    it('reports a missing note as not found rather than throwing', async () => {
        expect(await getProvider(lsItem('gone.txt')).read(lsItem('gone.txt'))).toEqual({ data: null, found: false });
    });

    it('keeps the other notes when one is written', async () => {
        const provider = getProvider(lsItem('a.txt'));
        await provider.write(lsItem('a.txt'), 'first');
        await provider.write(lsItem('b.txt'), 'second');
        expect((await provider.read(lsItem('a.txt'))).data).toBe('first');
        expect((await provider.read(lsItem('b.txt'))).data).toBe('second');
    });

    it('removes a note', async () => {
        const provider = getProvider(lsItem('a.txt'));
        await provider.write(lsItem('a.txt'), 'hello');
        await provider.remove(lsItem('a.txt'));
        expect((await provider.read(lsItem('a.txt'))).found).toBe(false);
    });

    it('turns a failed write into a StorageError rather than reporting success', async () => {
        jest.spyOn(notesStore, 'setNote').mockRejectedValue(new Error('QuotaExceededError'));
        await expect(getProvider(lsItem('a.txt')).write(lsItem('a.txt'), 'hello')).rejects.toThrow(StorageError);
    });

    it('turns a failed delete into a StorageError', async () => {
        jest.spyOn(notesStore, 'removeNote').mockRejectedValue(new Error('broken'));
        await expect(getProvider(lsItem('a.txt')).remove(lsItem('a.txt'))).rejects.toThrow(StorageError);
    });
});

describe('the picked-file backend', () => {
    it('reads the content that was picked from disk', async () => {
        expect(await getProvider(pickedItem('from disk')).read(pickedItem('from disk'))).toEqual({ data: 'from disk', found: true });
    });

    it('refuses to write or delete, so Save as stays the only route', async () => {
        await expect(getProvider(pickedItem('x')).write(pickedItem('x'), 'y')).rejects.toThrow(StorageError);
        await expect(getProvider(pickedItem('x')).remove(pickedItem('x'))).rejects.toThrow(StorageError);
    });
});

describe('the server backend', () => {
    it('refuses to delete, because the API has no delete action', async () => {
        await expect(getProvider(serverItem('/tmp/a.txt')).remove(serverItem('/tmp/a.txt'))).rejects.toThrow(StorageError);
    });
});

describe('migrating notes out of localStorage', () => {
    const LEGACY_KEY = 'privthing.files';

    const writeLegacy = (notes: object) => {
        window.localStorage.setItem(LEGACY_KEY, btoa(encodeURIComponent(JSON.stringify(notes))));
    };

    it('copies existing notes into the store on first use', async () => {
        writeLegacy({
            'old.txt': { data: 'written before the migration', lastModified: 123, size: 28 },
            'other.txt': { data: 'second note', lastModified: 456, size: 11 }
        });

        const store = require('../storage/notesStore');
        const notes = await store.allNotes();

        expect(Object.keys(notes).sort()).toEqual(['old.txt', 'other.txt']);
        expect(notes['old.txt'].data).toBe('written before the migration');
        expect(notes['old.txt'].lastModified).toBe(123);
    });

    it('leaves the old localStorage copy in place as a backup', async () => {
        writeLegacy({ 'old.txt': { data: 'keep me', lastModified: 1, size: 7 } });

        const store = require('../storage/notesStore');
        await store.allNotes();

        expect(window.localStorage.getItem(LEGACY_KEY)).not.toBeNull();
    });

    it('runs once, so a note deleted after migrating does not come back', async () => {
        writeLegacy({ 'old.txt': { data: 'delete me', lastModified: 1, size: 9 } });

        const store = require('../storage/notesStore');
        await store.allNotes();
        await store.removeNote('old.txt');

        expect(await store.getNote('old.txt')).toBeUndefined();
        expect(Object.keys(await store.allNotes())).not.toContain('old.txt');
    });

    it('starts empty when there is nothing to migrate', async () => {
        const store = require('../storage/notesStore');
        expect(await store.allNotes()).toEqual({});
    });
});

describe('the leftover localStorage backup', () => {
    const LEGACY_KEY = 'privthing.files';

    it('is not reported when there is none', () => {
        const store = require('../storage/notesStore');
        expect(store.legacyBackupSize()).toBeNull();
    });

    it('reports its size so settings can offer to remove it', () => {
        window.localStorage.setItem(LEGACY_KEY, btoa(encodeURIComponent(JSON.stringify({ 'a.txt': { data: 'x'.repeat(2000) } }))));
        const store = require('../storage/notesStore');
        expect(store.legacyBackupSize()).toBeGreaterThan(2000);
    });

    it('removes only the old key and leaves the notes alone', async () => {
        window.localStorage.setItem(LEGACY_KEY, btoa(encodeURIComponent(JSON.stringify({ 'a.txt': { data: 'old copy', lastModified: 1, size: 8 } }))));
        const store = require('../storage/notesStore');
        await store.allNotes();

        store.removeLegacyBackup();

        expect(store.legacyBackupSize()).toBeNull();
        expect((await store.getNote('a.txt')).data).toBe('old copy');
    });
});
