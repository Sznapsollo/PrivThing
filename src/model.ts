export interface MainContextType {
    secret: string,
    items: Item[],
    editedItem: Item,
    editedItemCandidate: Item,
    itemsListRefreshTrigger: number,
    itemsCss: string,
    homeCss: string
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

export interface Alert {
    header?: string,
    content?: string 
}