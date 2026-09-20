import { Item } from '../model';

export type StorageKind = 'localStorage' | 'server' | 'pickedFile';

export interface ReadResult {
    data: string | null,
    found: boolean,
    lastModified?: number
}

export interface WriteResult {
    lastModified?: number
}

export interface StorageProvider {
    kind: StorageKind,
    canWrite: boolean,
    canDelete: boolean,
    read: (item: Item) => Promise<ReadResult>,
    write: (item: Item, content: string, expectedLastModified?: number) => Promise<WriteResult>,
    remove: (item: Item) => Promise<void>
}

export class StorageError extends Error {
    code?: string;
    lastModified?: number;

    constructor(message: string, code?: string, lastModified?: number) {
        super(message);
        this.code = code;
        this.lastModified = lastModified;
    }
}

export const CONFLICT = 'CONFLICT';
