import { saveLocalStorage } from '../utils/utils';

let failNextSetMany = false;

vi.mock('idb-keyval', async (importOriginal) => {
    const original = await importOriginal<typeof import('idb-keyval')>();
    return {
        ...original,
        setMany: async (...args: Parameters<typeof original.setMany>) => {
            if (failNextSetMany) {
                failNextSetMany = false;
                throw new Error('IndexedDB is not available right now')
            }
            return original.setMany(...args)
        }
    }
});

describe('the notes store after a failed migration', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.resetModules();
    });

    it('fails the call that hit the error, then works again on the next one', async () => {
        saveLocalStorage('privthing.files', { 'old.txt': { data: 'from localStorage', lastModified: 5, size: 17 } });
        failNextSetMany = true;
        const store = await import('../storage/notesStore');

        await expect(store.allNotes()).rejects.toThrow('IndexedDB is not available');

        const notes = await store.allNotes();
        expect(notes['old.txt']?.data).toBe('from localStorage');
        expect(window.localStorage.getItem('privthing.notesMigratedToIdb')).not.toBeNull();
    });
});
