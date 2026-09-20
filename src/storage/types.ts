import { Item } from '../model';

export type StorageKind = 'localStorage' | 'server' | 'pickedFile';

export interface ReadResult {
    data: string | null,
    found: boolean
}

export interface StorageProvider {
    kind: StorageKind,
    canWrite: boolean,
    canDelete: boolean,
    read: (item: Item) => Promise<ReadResult>,
    write: (item: Item, content: string) => Promise<void>,
    remove: (item: Item) => Promise<void>
}

export class StorageError extends Error {}
