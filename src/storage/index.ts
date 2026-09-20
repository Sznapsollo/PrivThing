import { Item } from '../model';
import { localStorageProvider, LOCAL_STORAGE_FOLDER } from './localStorageProvider';
import { pickedFileProvider } from './pickedFileProvider';
import { serverProvider } from './serverProvider';
import { StorageProvider } from './types';

export * from './types';
export { LOCAL_STORAGE_FOLDER };

export function getProvider(item: Item): StorageProvider {
    if (item.folder === LOCAL_STORAGE_FOLDER) {
        return localStorageProvider
    }
    if (item.fetchData === true) {
        return serverProvider
    }
    return pickedFileProvider
}

export function localStorageItem(name: string): Item {
    return { name: name, folder: LOCAL_STORAGE_FOLDER, path: LOCAL_STORAGE_FOLDER + '/' + name }
}
