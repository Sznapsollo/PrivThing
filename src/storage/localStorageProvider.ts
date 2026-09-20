import { Item } from '../model';
import { getNote, removeNote, setNote } from './notesStore';
import { ReadResult, StorageError, StorageProvider, WriteResult } from './types';

export const LOCAL_STORAGE_FOLDER = 'localStorage';

export const localStorageProvider: StorageProvider = {
    kind: 'localStorage',
    canWrite: true,
    canDelete: true,

    read: async (item: Item): Promise<ReadResult> => {
        const record = await getNote(item.name);
        if (record == null || record.data == null) {
            return { data: null, found: false }
        }
        return { data: record.data, found: true, lastModified: record.lastModified }
    },

    write: async (item: Item, content: string): Promise<WriteResult> => {
        const lastModified = new Date().getTime();
        try {
            await setNote(item.name, {
                data: content,
                lastModified: lastModified,
                size: content.length
            });
        } catch (e) {
            throw new StorageError('Could not store the note: ' + (e as Error)?.message)
        }
        return { lastModified: lastModified }
    },

    remove: async (item: Item): Promise<void> => {
        try {
            await removeNote(item.name);
        } catch (e) {
            throw new StorageError('Could not delete the note: ' + (e as Error)?.message)
        }
    }
};
