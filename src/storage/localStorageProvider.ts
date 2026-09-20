import { Item } from '../model';
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils';
import { ReadResult, StorageError, StorageProvider } from './types';

export const LOCAL_STORAGE_FOLDER = 'localStorage';
const FILES_KEY = 'privthing.files';

export const localStorageProvider: StorageProvider = {
    kind: 'localStorage',
    canWrite: true,
    canDelete: true,

    read: async (item: Item): Promise<ReadResult> => {
        const files = retrieveLocalStorage(FILES_KEY);
        const file = files ? files[item.name] : null;
        if (file == null || file.data == null) {
            return { data: null, found: false }
        }
        return { data: file.data, found: true }
    },

    write: async (item: Item, content: string): Promise<void> => {
        const files = retrieveLocalStorage(FILES_KEY) || {};
        files[item.name] = {
            size: content.length,
            lastModified: new Date().getTime(),
            data: content
        };
        if (!saveLocalStorage(FILES_KEY, files)) {
            throw new StorageError('Could not write to localStorage')
        }
    },

    remove: async (item: Item): Promise<void> => {
        const files = retrieveLocalStorage(FILES_KEY) || {};
        delete files[item.name];
        if (!saveLocalStorage(FILES_KEY, files)) {
            throw new StorageError('Could not write to localStorage')
        }
    }
};
