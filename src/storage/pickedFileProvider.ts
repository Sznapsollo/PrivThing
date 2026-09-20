import { Item } from '../model';
import { ReadResult, StorageError, StorageProvider, WriteResult } from './types';

export const pickedFileProvider: StorageProvider = {
    kind: 'pickedFile',
    canWrite: false,
    canDelete: false,

    read: async (item: Item): Promise<ReadResult> => {
        return { data: item.rawNote || '', found: true }
    },

    write: async (): Promise<WriteResult> => {
        throw new StorageError('A picked file can only be saved with Save as')
    },

    remove: async (): Promise<void> => {
        throw new StorageError('A picked file cannot be deleted from here')
    }
};
