import { Item } from '../model';

export function displayItemPath(item: Item): string {
    if (!item?.folderLabel || !item.folder || !item.path) {
        return item?.path || ''
    }

    if (!item.path.startsWith(item.folder)) {
        return item.path
    }

    const withinFolder = item.path.substring(item.folder.length);
    return item.folderLabel.replace(/\/+$/, '') + '/' + withinFolder
}
