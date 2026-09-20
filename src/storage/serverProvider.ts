import axios from 'axios';
import { Item } from '../model';
import { ReadResult, StorageError, StorageProvider } from './types';

const post = async (body: object) => {
    const response = await axios.post('actions', JSON.stringify(body), {
        headers: { "Content-Type": 'application/json' }
    });
    const data = response.data;
    if (data?.status !== 0) {
        throw new StorageError(data?.data || 'Server refused the request')
    }
    return data
};

export const serverProvider: StorageProvider = {
    kind: 'server',
    canWrite: true,
    canDelete: false,

    read: async (item: Item): Promise<ReadResult> => {
        const data = await post({ type: 'retrieveFileFromPath', data: item.path });
        if (typeof data.data !== 'string') {
            return { data: null, found: false }
        }
        return { data: data.data, found: true }
    },

    write: async (item: Item, content: string): Promise<void> => {
        await post({ type: 'updateFileFromPath', data: content, path: item.path });
    },

    remove: async (): Promise<void> => {
        throw new StorageError('The server API has no delete action')
    }
};
