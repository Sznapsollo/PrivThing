export interface MainContextType {
    secret: string,
    editedItem: Item,
    editedItemCandidate: Item,
    homeCss: string,
    items: Item[],
    itemsListRefreshTrigger: number,
    itemsCss: string,
    showSettings: boolean
}

export interface Item {
    name: string,
    path: string,
    size: number,
    rawNote?: string,
    fetchData?: boolean,
    new?: boolean,
    lastModified?: number
}

export interface SearchContextType {
    sort: string,
    searchQuery: string
}

export interface SettingsContextType {
    forgetSecretTime: number,
    forgetSecretMode: string // IMMEDIATE, AFTER_TIME, NEVER
}

export interface Alert {
    header?: string,
    content?: string 
}