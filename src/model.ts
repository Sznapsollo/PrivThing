import {AlertColor} from '@mui/material'

export interface AlertData {
    buttonLabel?: string,
    header?: string,
    message?: string,
    show: boolean
}

export interface GenericContextMenu {
    show: boolean,
    menuActions: GenericContextMenuItem[],
    x: number,
    y: number
}

export interface GenericContextMenuItem {
    title: string,
    action: string,
}

export interface GenericContextMenuAction {
    action: string,
}

export interface Folder {
    name: string,
    itemsCount: number
}

export interface Item {
    fetchData?: boolean,
    folder?: string,
    lastModified?: number,
    name: string,
    path: string,
    excludeFromAll?: boolean,
    rawNote?: string,
    size?: number
}

export interface MainContextType {
    // data for modal alert
    alertData?: AlertData
    activeEditedItemPath?: string,
    // current edit item edited / viewed by user
    editedItemSpaces: EditItem[],
    // initial item to be open. exists so if user has some unsaved data, there will be prompt to save it first before loading edited item
    editedItemCandidate?: NavigationItem,
    // unique items folders calculated after items load
    folders: Folder[],
    // all items
    items: Item[],
    // user tabs
    tabs: Tab[],
    favourites: EditItem[],
    // to operate full screen items for smaller screens - flag for layout to resize items list full screen
    fullItems: boolean,
    // just a number to trigger items list rerender
    itemsListRefreshTrigger: number,
    // data for showed notification
    notificationData?: NotificationData,
    // we store temporarity only one secret that user decrypted until user forgets it/ its auto dismissed/ usere opens doc with other secret/ page is refreshed
    secret: string,
    // show settings
    showSettings: boolean,
    // show favourites,
    showFavourites: boolean,
    // open after list is loaded. taken from newPathToOpenCandidate and filled if exists in items after load by path
    newItemToOpen?: Item,
    // candidate to open newly added
    newPathToOpenCandidate?: string
}

export interface NavigationItem {
    id?: string,
    item: Item,
    tab?: Tab,
    action?: string
}

export interface NotificationData {
    message?: string,
    show: boolean,
    type: AlertColor,
    closeAfter?: number
}

export interface ProcessingResult {
    name: string, 
    result: string, 
    status: number
}

export interface SaveAsResults {
    fileName: string,
    saveAsType: string,
    encryptData: boolean
    secret?: string
}

export interface SearchContextType {
    currentFolder: string
    searchQuery: string,
    sort: string,
}

export interface SettingsContextType {
    forgetSecretMode: string, // IMMEDIATE, AFTER_TIME, NEVER
    forgetSecretTime: number,
    codeMirrorTheme?: string,
    enableFileServer?: boolean,
    showHints?: boolean,
    stretchNoteSpaceOnActive?: boolean,
    customThemeColors: LooseObject
}

export interface Tab extends Item {
    isActive?: boolean,
    isDragged?: boolean,
    isNew?: boolean,
    remove?: boolean,
    scrollTop?: number,
    tabId: string
}

export interface EditItem extends Item {
    isActive?: boolean,
    flex?: number
}

export interface TabContextMenu extends GenericContextMenu {
    tab?: Tab
}

export interface NoteSpaceContextMenu extends GenericContextMenu {
    noteSpaceItem?: EditItem
}

export interface NoteContextMenu extends GenericContextMenu {
    selectionStart?: number,
    selectionEnd?: number,
    clickedLine?: number,
    clickEvent?: any
}

export interface LooseObject {
    [key: string]: any
}