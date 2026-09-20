import { getProvider, localStorageItem, StorageError } from '../storage';
import { Item } from '../model';

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

    it('throws when the quota is full instead of reporting success', async () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            const error = new Error('quota');
            error.name = 'QuotaExceededError';
            throw error
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        await expect(getProvider(lsItem('a.txt')).write(lsItem('a.txt'), 'hello')).rejects.toThrow(StorageError);
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
