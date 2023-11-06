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
    new?: boolean,
    path: string,
    rawNote?: string,
    size: number
}
export interface MainContextType {
    alertData?: AlertData
    editedItem: Item,
    editedItemCandidate: Item,
    folders: string[],
    items: Item[],
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