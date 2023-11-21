import {AlertColor} from '@mui/material'

export interface AlertData {
    buttonLabel?: string,
    header?: string,
    message?: string,
    show: boolean
}

export interface Item {
    fetchData?: boolean,
    folder?: string,
    lastModified?: number,
    name: string,
    path: string,
    rawNote?: string,
    size?: number
}

export interface Tab extends Item {
    active?: boolean,
    isDragged?: boolean,
    isNew?: boolean,
    remove?: boolean,
    scrollTop?: number,
    tabId: string
}

export interface Folder {
    name: string,
    itemsCount: number
}

export interface ContextMenu {
    show: boolean,
    x: number,
    y: number
}

export interface TabContextMenu extends ContextMenu {
    tab?: Tab
}

export interface NavigationItem {
    item: Item,
    tab?: Tab,
    action?: string
}

export interface MainContextType {
    // data for modal alert
    alertData?: AlertData
    // current edit item edited / viewed by user
    editedItem: Item,
    // initial item to be open. exists so if user has some unsaved data, there will be prompt to save it first before loading edited item
    editedItemCandidate: NavigationItem,
    // unique items folders calculated after items load
    folders: Folder[],
    // all items
    items: Item[],
    // user tabs
    tabs: Tab[],
    // to operate full screen items for smaller screens
    fullItems: boolean,
    // just a number to trigger items list rerender
    itemsListRefreshTrigger: number,
    // data for showed notification
    notificationData?: NotificationData,
    secret: string,
    // show settings
    showSettings: boolean,
    // open after list is loaded. taken from newPathToOpenCandidate and filled if exists in items after load by path
    newItemToOpen?: Item,
    // candidate to open newly added
    newPathToOpenCandidate?: string
}

export interface NotificationData {
    message?: string,
    show: boolean,
    type: AlertColor,
    closeAfter?: number
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
    enableFileServer?: boolean
}