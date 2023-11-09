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
    size: number,
    newTab?: boolean
}

export interface Tab extends Item {
    active?: boolean,
    isDragged?: boolean,
    isNew?: boolean,
    remove?: boolean,
    scrollTop?: number,
    tabId: string
}

export interface NavigationItem {
    item: Item,
    tab?: Tab,
    action?: string
}

export interface MainContextType {
    alertData?: AlertData
    editedItem: Item,
    editedItemCandidate: NavigationItem,
    folders: string[],
    items: Item[],
    tabs: Tab[],
    fullItems: boolean,
    itemsListRefreshTrigger: number,
    notificationData?: NotificationData,
    secret: string,
    showSettings: boolean
}

export interface NotificationData {
    message?: string,
    show: boolean,
    type: AlertColor,
    closeAfter?: number
}

export interface SearchContextType {
    currentFolder: string
    searchQuery: string,
    sort: string,
}

export interface SettingsContextType {
    forgetSecretMode: string, // IMMEDIATE, AFTER_TIME, NEVER
    forgetSecretTime: number
}