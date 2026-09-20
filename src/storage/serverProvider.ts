import axios from 'axios';
import { Item } from '../model';
import { ReadResult, StorageError, StorageProvider, WriteResult } from './types';

const post = async (body: object) => {
    const response = await axios.post('actions', JSON.stringify(body), {
        headers: { "Content-Type": 'application/json' }
    });
    const data = response.data;
    if (data?.status !== 0) {
        throw new StorageError(data?.data || 'Server refused the request', data?.code, data?.lastModified)
    }
    return data
};

export async function createServerFile(folder: string, name: string, content: string): Promise<string> {
    const data = await post({ type: 'createFileInFolder', folder: folder, name: name, data: content });
    return data?.data?.path || ''
}

export const serverProvider: StorageProvider = {
    kind: 'server',
    canWrite: true,
    canDelete: false,

    read: async (item: Item): Promise<ReadResult> => {
        const data = await post({ type: 'retrieveFileFromPath', data: item.path });
        if (typeof data.data !== 'string') {
            return { data: null, found: false }
        }
        return { data: data.data, found: true, lastModified: data.lastModified }
    },

    write: async (item: Item, content: string, expectedLastModified?: number): Promise<WriteResult> => {
        const data = await post({
            type: 'updateFileFromPath',
            data: content,
            path: item.path,
            lastModified: expectedLastModified
        });
        return { lastModified: data.lastModified }
    },

    remove: async (): Promise<void> => {
        throw new StorageError('The server API has no delete action')
    }
};
