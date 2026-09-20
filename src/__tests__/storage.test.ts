import { CONFLICT, getProvider, localStorageItem, StorageError } from '../storage';
import axios from 'axios';
import { createServerFile } from '../storage/serverProvider';
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

    it('writes a note and reads it back, with the time it was written', async () => {
        const provider = getProvider(lsItem('a.txt'));
        const written = await provider.write(lsItem('a.txt'), 'hello');
        const read = await provider.read(lsItem('a.txt'));

        expect(read.data).toBe('hello');
        expect(read.found).toBe(true);
        expect(read.lastModified).toBe(written.lastModified);
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
    afterEach(() => jest.restoreAllMocks());

    it('refuses to delete, because the API has no delete action', async () => {
        await expect(getProvider(serverItem('/tmp/a.txt')).remove(serverItem('/tmp/a.txt'))).rejects.toThrow(StorageError);
    });

    it('turns a refusal into a StorageError carrying the server reason', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: -1, data: 'Access to file denied.' } });

        await expect(createServerFile('/notes/', 'new.txt', 'x')).rejects.toThrow('Access to file denied.');
    });

    it('sends the timestamp it read, and keeps the one the server returns', async () => {
        const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: 0, lastModified: 222 } });

        const written = await getProvider(serverItem('/tmp/a.txt')).write(serverItem('/tmp/a.txt'), 'new text', 111);

        expect(JSON.parse(post.mock.calls[0][1] as string)).toEqual({
            type: 'updateFileFromPath', data: 'new text', path: '/tmp/a.txt', lastModified: 111
        });
        expect(written.lastModified).toBe(222);
    });

    it('reports a stale write as a conflict the editor can recognise', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: -1, code: 'CONFLICT', data: 'File changed on disk.', lastModified: 999 } });

        const failure = await getProvider(serverItem('/tmp/a.txt'))
            .write(serverItem('/tmp/a.txt'), 'mine', 111)
            .catch((e) => e);

        expect(failure).toBeInstanceOf(StorageError);
        expect(failure.code).toBe(CONFLICT);
        expect(failure.lastModified).toBe(999);
    });

    it('reads the timestamp along with the content', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: 0, data: 'file text', lastModified: 333 } });
        expect(await getProvider(serverItem('/tmp/a.txt')).read(serverItem('/tmp/a.txt')))
            .toEqual({ data: 'file text', found: true, lastModified: 333 });
    });

    it('creates a file in a folder and returns its new path', async () => {
        const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: 0, data: { path: '/notes/new.txt' } } });

        const created = await createServerFile('/notes/', 'new.txt', 'hello');

        expect(created).toBe('/notes/new.txt');
        expect(JSON.parse(post.mock.calls[0][1] as string)).toEqual({ type: 'createFileInFolder', folder: '/notes/', name: 'new.txt', data: 'hello' });
    });

    it('turns a refused create into a StorageError', async () => {
        jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: -1, data: 'File already exists.' } });
        await expect(createServerFile('/notes/', 'new.txt', 'hello')).rejects.toThrow(StorageError);
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
