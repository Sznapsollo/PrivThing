import { createStore, set } from 'idb-keyval';
import { getProvider, localStorageItem } from '../storage';
import * as notesStore from '../storage/notesStore';
import * as trashStore from '../storage/trashStore';

const note = (name: string) => localStorageItem(name);

beforeEach(async () => {
    await trashStore.emptyTrash();
    for (const name of Object.keys(await notesStore.allNotes())) {
        await notesStore.removeNote(name);
    }
    window.localStorage.clear();
});

describe('picking a free name when restoring', () => {
    it('keeps the original name when nothing is in the way', () => {
        expect(trashStore.freeNoteName('notes.txt', ['other.txt'])).toBe('notes.txt');
    });

    it('marks it restored when the name is taken', () => {
        expect(trashStore.freeNoteName('notes.txt', ['notes.txt'])).toBe('notes (restored).txt');
    });

    it('counts up when that is taken too', () => {
        expect(trashStore.freeNoteName('notes.txt', ['notes.txt', 'notes (restored).txt'])).toBe('notes (restored 2).txt');
    });

    it('handles a name with no extension', () => {
        expect(trashStore.freeNoteName('README', ['README'])).toBe('README (restored)');
    });
});

describe('deleting a browser note', () => {
    it('moves it to the trash instead of destroying it', async () => {
        await getProvider(note('a.txt')).write(note('a.txt'), 'keep me safe');
        await getProvider(note('a.txt')).remove(note('a.txt'));

        expect((await notesStore.getNote('a.txt'))).toBeUndefined();

        const trashed = await trashStore.listTrash();
        expect(trashed).toHaveLength(1);
        expect(trashed[0].name).toBe('a.txt');
        expect(trashed[0].data).toBe('keep me safe');
        expect(trashed[0].deletedAt).toBeGreaterThan(0);
    });

    it('restores it with its content intact', async () => {
        await getProvider(note('a.txt')).write(note('a.txt'), 'the original text');
        await getProvider(note('a.txt')).remove(note('a.txt'));

        const restoredName = await trashStore.restoreTrashedNote('a.txt');

        expect(restoredName).toBe('a.txt');
        expect((await notesStore.getNote('a.txt'))?.data).toBe('the original text');
        expect(await trashStore.listTrash()).toHaveLength(0);
    });

    it('does not overwrite a note that took the name in the meantime', async () => {
        await getProvider(note('a.txt')).write(note('a.txt'), 'the deleted one');
        await getProvider(note('a.txt')).remove(note('a.txt'));
        await getProvider(note('a.txt')).write(note('a.txt'), 'the new one');

        const restoredName = await trashStore.restoreTrashedNote('a.txt');

        expect(restoredName).toBe('a (restored).txt');
        expect((await notesStore.getNote('a.txt'))?.data).toBe('the new one');
        expect((await notesStore.getNote('a (restored).txt'))?.data).toBe('the deleted one');
    });

    it('can be thrown away for good', async () => {
        await getProvider(note('a.txt')).write(note('a.txt'), 'x');
        await getProvider(note('a.txt')).remove(note('a.txt'));

        await trashStore.deleteTrashedNote('a.txt');

        expect(await trashStore.listTrash()).toHaveLength(0);
        expect(await trashStore.restoreTrashedNote('a.txt')).toBeNull();
    });

    it('keeps an encrypted note encrypted while it sits in the trash', async () => {
        await getProvider(note('s.prvthng')).write(note('s.prvthng'), 'privthingencrypted2_AAAA');
        await getProvider(note('s.prvthng')).remove(note('s.prvthng'));

        expect((await trashStore.listTrash())[0].data).toBe('privthingencrypted2_AAAA');
    });
});

describe('sweeping the trash', () => {
    const rawTrash = createStore('privthing-trash', 'trash');

    const trashAgedNote = async (name: string, daysAgo: number) => {
        await set(name, {
            name: name,
            data: 'aged ' + name,
            lastModified: 1,
            size: 5,
            deletedAt: new Date().getTime() - (daysAgo * 24 * 60 * 60 * 1000)
        }, rawTrash);
    };

    it('drops what is past thirty days and keeps what is not', async () => {
        await trashAgedNote('ancient.txt', 40);
        await trashAgedNote('recent.txt', 3);

        const removed = await trashStore.sweepTrash();

        expect(removed).toBe(1);
        expect((await trashStore.listTrash()).map((trashed) => trashed.name)).toEqual(['recent.txt']);
    });

    it('sweeps whenever the trash is listed, so nothing stale is ever shown', async () => {
        await trashAgedNote('ancient.txt', 40);
        expect(await trashStore.listTrash()).toHaveLength(0);
    });

    it('refuses to restore something the sweep already took', async () => {
        await trashAgedNote('ancient.txt', 40);
        await trashStore.sweepTrash();
        expect(await trashStore.restoreTrashedNote('ancient.txt')).toBeNull();
    });
});
