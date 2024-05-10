
import { AlertData, Item, NavigationItem, Tab, MainContextType, NotificationData, SearchContextType, SettingsContextType, Folder, ProcessingResult, EditItem, LooseObject, SearchQueryItem } from '../model'
import { makeId, manageEditItemSpaces, manageHeaderTabs, retrieveLocalStorage, saveLocalStorage } from '../utils/utils'

export enum MAIN_ACTIONS {
    ADD_TO_FAVOURITES = 'ADD_TO_FAVOURITES',
    CLEAR_EDITED_ITEM = 'CLEAR_EDITED_ITEM',
    CLEAR_OTHER_NOTE_SPACES = 'CLEAR_OTHER_NOTE_SPACES',
    CLEAR_SECRET = 'CLEAR_SECRET',
    HIDE_ITEMS_BAR = 'HIDE_ITEMS_BAR',
    HIDE_SETTINGS = 'HIDE_SETTINGS',
    LOAD_FROM_PICKED_FILE = 'LOAD_FROM_PICKED_FILE',
    REMOVE_NOTE_SPACE = 'REMOVE_NOTE_SPACE_ACTIVE',
    REMOVE_FROM_FAVOURITES = 'REMOVE_FROM_FAVOURITES',
    SET_EDITED_ITEM_CANDIDATE = 'SET_EDITED_ITEM_CANDIDATE',
    SET_EDITED_ITEM = 'SET_EDITED_ITEM',
    SET_NOTE_SPACE_ACTIVE = 'SET_NOTE_SPACE_ACTIVE',
    SET_ITEMS = 'SET_ITEMS',
    SHOW_ALERT_MODAL = 'SHOW_ALERT_MODAL',
    SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',
    SHOW_SETTINGS = 'SHOW_SETTINGS',
    SHRINK_NOTE_SPACE = 'SHRINK_NOTE_SPACE',
    STRETCH_NOTE_SPACE = 'STRETCH_NOTE_SPACE',
    TOGGLE_FAVOURITES = 'TOGGLE_FAVOURITES',
    TOGGLE_ITEMS_BAR = 'TOGGLE_ITEMS_BAR',
    UPDATE_FAVOURITES = 'UPDATE_FAVOURITES',
    UPDATE_ITEMS_LIST = 'UPDATE_ITEMS_LIST',
    UPDATE_TABS = 'UPDATE_TABS',
    UPDATE_TABS_SILENT = 'UPDATE_TABS_SILENT',
    UPDATE_SECRET = 'UPDATE_SECRET'
}

type AddToFavourites = {type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: EditItem};
type ClearEditedItem = {type: MAIN_ACTIONS.CLEAR_EDITED_ITEM};
type ClearNoteSpaces = {type: MAIN_ACTIONS.CLEAR_OTHER_NOTE_SPACES, payload: EditItem};
type ClearSecret = {type: MAIN_ACTIONS.CLEAR_SECRET};
type HideItemsBar = {type: MAIN_ACTIONS.HIDE_ITEMS_BAR};
type HideSettings = {type: MAIN_ACTIONS.HIDE_SETTINGS};
type LoadFromPickedFile = {type: MAIN_ACTIONS.LOAD_FROM_PICKED_FILE, payload: any};
type RemoveEditedSpace = {type: MAIN_ACTIONS.REMOVE_NOTE_SPACE, payload: EditItem};
type RemoveFromFavourites = {type: MAIN_ACTIONS.REMOVE_FROM_FAVOURITES, payload: EditItem};
type SetEditedItemCandidate = {type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: NavigationItem};
type SetEditedItem = {type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: NavigationItem};
type SetEditedSpaceActive = {type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: EditItem};
type SetItems = {type: MAIN_ACTIONS.SET_ITEMS, payload: Item[]};
type ShowAlertModal = {type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: AlertData};
type ShowNotification = {type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: NotificationData};
type ShowSettings = {type: MAIN_ACTIONS.SHOW_SETTINGS};
type ShrinkNoteSpace = {type: MAIN_ACTIONS.SHRINK_NOTE_SPACE, payload: EditItem};
type StretchNoteSpace = {type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: EditItem};
type ToggleFavourites = {type: MAIN_ACTIONS.TOGGLE_FAVOURITES};
type ToggleItemsBar = {type: MAIN_ACTIONS.TOGGLE_ITEMS_BAR};
type UpdateFavourites = {type: MAIN_ACTIONS.UPDATE_FAVOURITES, payload: EditItem[]};
type UpdateItemsList = {type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: string};
type UpdateTabs = {type: MAIN_ACTIONS.UPDATE_TABS, payload: Tab[]};
type UpdateTabsSilent = {type: MAIN_ACTIONS.UPDATE_TABS_SILENT, payload: Tab[]};
type UpdateSecret = {type: MAIN_ACTIONS.UPDATE_SECRET, payload: string};

export type MainActions = AddToFavourites | 
    ClearEditedItem |
    ClearNoteSpaces |     
    ClearSecret | 
    HideItemsBar | 
    HideSettings |
    LoadFromPickedFile | 
    RemoveEditedSpace |
    RemoveFromFavourites |
    SetEditedItemCandidate | 
    SetEditedItem | 
    SetEditedSpaceActive |
    SetItems | 
    ShowAlertModal | 
    ShowNotification |
    ShrinkNoteSpace |
    ShowSettings |
    StretchNoteSpace |
    ToggleFavourites | 
    ToggleItemsBar | 
    UpdateFavourites | 
    UpdateItemsList | 
    UpdateTabs |
    UpdateTabsSilent |
    UpdateSecret;

export const mainReducer = (state: MainContextType, action: MainActions) => {
    // console.log('mainReducer', action.type)
    switch (action.type) {
        case MAIN_ACTIONS.ADD_TO_FAVOURITES:
            return { 
                ...state, 
                favourites: [...state.favourites.filter((item, index) => item.path !== action.payload.path), {...action.payload}]
            };
        case MAIN_ACTIONS.HIDE_ITEMS_BAR:
            return { ...state, fullItems: false};
        case MAIN_ACTIONS.HIDE_SETTINGS:
            return { ...state, showSettings: false };
        case MAIN_ACTIONS.LOAD_FROM_PICKED_FILE:
            return { ...state, pickedFileEvent: action.payload };
        case MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE:
            return { ...state, editedItemCandidate: {...action.payload, id: makeId(10)}, fullItems: false };
        case MAIN_ACTIONS.SET_EDITED_ITEM:
            if(!action.payload.item) {
                // console.log('No item in payload')
                return {...state}
            }
            
            let itemPayload = {...action.payload.item};
            let tabPayLoad = action.payload.tab;
            let updatedTabs: Tab[] = state.tabs.slice() || []
            
            if(action.payload.action === "REMOVE_TAB" && action.payload.tab) {
                let tabToBeRemovedIndex = updatedTabs.findIndex((tab) => tab.tabId === tabPayLoad?.tabId);
                if(tabToBeRemovedIndex < 0 ) {
                    return {...state}
                }
                let tabToBeRemoved = updatedTabs[tabToBeRemovedIndex];

                if(!tabToBeRemoved.isActive) {
                    return {...state, tabs: updatedTabs.filter((item, index) => index !== tabToBeRemovedIndex)}
                } else {
                    if(tabToBeRemovedIndex > 0) {
                        updatedTabs[tabToBeRemovedIndex-1].isActive = true;
                        itemPayload = updatedTabs[tabToBeRemovedIndex-1];
                        tabPayLoad = undefined;
                    } else if(tabToBeRemovedIndex === 0 && updatedTabs.length > 1) {
                        updatedTabs[tabToBeRemovedIndex+1].isActive = true;
                        itemPayload = updatedTabs[tabToBeRemovedIndex+1];
                        tabPayLoad = undefined;
                    }
                    updatedTabs = updatedTabs.filter((item, index) => index !== tabToBeRemovedIndex);
                }
            }
            updatedTabs = manageHeaderTabs(updatedTabs, itemPayload, tabPayLoad);
            let editedItemSpaces = state.editedItemSpaces || [];
            if(action.payload.action === "NEW_NOTE_SPACE") {
                editedItemSpaces = editedItemSpaces.map((editedItemSpace) => { editedItemSpace.isActive = false; return editedItemSpace });
                editedItemSpaces = [...editedItemSpaces, {...itemPayload, isActive: true}];
            } else if(action.payload.action === "CLEAR_OTHER_NOTE_SPACES") {
                editedItemSpaces = [{...itemPayload, isActive: true}];
            } else {
                editedItemSpaces = manageEditItemSpaces(editedItemSpaces, itemPayload);
            }

            return { 
                ...state, 
                editedItemSpaces: editedItemSpaces, 
                activeEditedItemPath: itemPayload.path,
                tabs: updatedTabs, 
                newItemToOpen: undefined ,
                editedItemCandidate: undefined
            };
        case MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE:
            if(!action.payload) {
                // console.log('No item in payload')
                return {...state}
            }

            return {
                ...state,
                activeEditedItemPath: action.payload.path,
                editedItemSpaces: state.editedItemSpaces.map((editedItemSpace) => { 
                    if(editedItemSpace === action.payload) {
                        return {...editedItemSpace, isActive: true}
                    }
                    return {...editedItemSpace, isActive: false}
                }),
                tabs: manageHeaderTabs((state.tabs.slice() || []), action.payload, null, 'CHANGE_ACTIVE')
            }
        case MAIN_ACTIONS.REMOVE_NOTE_SPACE:
            if(!action.payload) {
                // console.log('No item in payload')
                return {...state}
            }

            let foundActiveEditItemSpaceIndex =  state.editedItemSpaces.findIndex((editedItemSpace) => { 
                return (editedItemSpace === action.payload)
            })

            if(foundActiveEditItemSpaceIndex < 0) {
                return {...state}
            }

            let newActiveEditItemSpace
            let activeEditedItemPath = state.activeEditedItemPath;
            let foundActiveEditItemSpace = state.editedItemSpaces[foundActiveEditItemSpaceIndex];
            let updatedActiveEditItemSpaces = state.editedItemSpaces.filter((item, index) => index !== foundActiveEditItemSpaceIndex)
            if(foundActiveEditItemSpace.isActive) {
                let newActiveIndex = 0;
                if(foundActiveEditItemSpaceIndex > 0) {
                    newActiveIndex = foundActiveEditItemSpaceIndex-1;
                }
                newActiveEditItemSpace = updatedActiveEditItemSpaces[newActiveIndex];
                newActiveEditItemSpace.isActive = true;
                activeEditedItemPath = newActiveEditItemSpace.path;
            }

            return {
                ...state,
                activeEditedItemPath: activeEditedItemPath,
                editedItemSpaces: updatedActiveEditItemSpaces,
                tabs: newActiveEditItemSpace ? manageHeaderTabs((state.tabs.slice() || []), newActiveEditItemSpace, null, 'CHANGE_ACTIVE') : state.tabs
            }
        case MAIN_ACTIONS.REMOVE_FROM_FAVOURITES:
            return { 
                ...state, 
                favourites: state.favourites.filter((item, index) => item.path !== action.payload.path)
            };
        case MAIN_ACTIONS.CLEAR_EDITED_ITEM:
            const clearedItem: Item = {
                name: '',
                path: '',
                size: 0,
                rawNote: undefined
            };

            return { ...state, editedItemSpaces: manageEditItemSpaces(state.editedItemSpaces, clearedItem) };
        case MAIN_ACTIONS.CLEAR_OTHER_NOTE_SPACES:
            return { ...state, editedItemSpaces: [{...action.payload, isActive: true}] };
        case MAIN_ACTIONS.CLEAR_SECRET:
            return { ...state, secret: '' };
        case MAIN_ACTIONS.SET_ITEMS:
            let folders:Folder[] = [];
            let items: Item[] = [];
            if(action.payload && action.payload.length) {
                items = items.concat(action.payload);
            }
            let newItemToOpen;
            items.forEach((item) => {
                let foundFolder = folders.find((folder) => folder.name === item.folder);
                if(foundFolder) {
                    foundFolder.itemsCount++;
                } else {
                    folders.push({
                        name: item.folder,
                        itemsCount: 1
                    } as Folder);
                }
                if(state.newPathToOpenCandidate && item.path === state.newPathToOpenCandidate) {
                    newItemToOpen = item;
                }
            })
            return { ...state, items: items, folders: folders, newPathToOpenCandidate: '', newItemToOpen: newItemToOpen };
        case MAIN_ACTIONS.SHOW_ALERT_MODAL:
            return { ...state, alertData: action.payload };
        case MAIN_ACTIONS.SHOW_NOTIFICATION:
            return { ...state, notificationData: action.payload };
        case MAIN_ACTIONS.SHOW_SETTINGS:
            return { ...state, showSettings: true };
        case MAIN_ACTIONS.SHRINK_NOTE_SPACE:
            return {
                ...state,
                editedItemSpaces: state.editedItemSpaces.map((editedItemSpace) => { 
                    return {...editedItemSpace, flex: 1}
                })
            }
        case MAIN_ACTIONS.STRETCH_NOTE_SPACE:
            return {
                ...state,
                editedItemSpaces: state.editedItemSpaces.map((editedItemSpace) => { 
                    if(editedItemSpace === action.payload) {
                        return {...editedItemSpace, flex: 2}
                    }
                    return {...editedItemSpace, flex: 1}
                })
            }
        case MAIN_ACTIONS.TOGGLE_FAVOURITES:
                return { ...state, showFavourites: !state.showFavourites };
        case MAIN_ACTIONS.TOGGLE_ITEMS_BAR:
            return { ...state, fullItems: !state.fullItems };
        case MAIN_ACTIONS.UPDATE_FAVOURITES:
            return { ...state, favourites: action.payload};
        case MAIN_ACTIONS.UPDATE_ITEMS_LIST:
            return { ...state, itemsListRefreshTrigger: new Date().getTime(), newItemToOpen: undefined, newPathToOpenCandidate: action.payload };
        case MAIN_ACTIONS.UPDATE_SECRET:
            return { ...state, secret: action.payload};
        case MAIN_ACTIONS.UPDATE_TABS:
            return { ...state, tabs: action.payload};
        case MAIN_ACTIONS.UPDATE_TABS_SILENT:
            if(state.tabs) {
                if(timeoutUpdatesHandles["privthing.pmTabs"] != null) {
                    clearTimeout(timeoutUpdatesHandles["privthing.pmTabs"]);
                    timeoutUpdatesHandles["privthing.pmTabs"] = null;
                }
                timeoutUpdatesHandles["privthing.pmTabs"] = setTimeout(() => {
                    saveLocalStorage("privthing.pmTabs", state.tabs);
                }, 100)
            }
            state.tabs = [...action.payload]
            return state
        default:
            return state;
    }
};

export enum SEARCH_ACTIONS {
    CLEAR_FILTERS = 'CLEAR_FILTERS',
    FILTER_BY_SEARCH = 'FILTER_BY_SEARCH',
    SET_CURRENT_FOLDER = 'SET_CURRENT_FOLDER',
    SORT_BY = 'SORT_BY'
}

type ClearFilters = {type: SEARCH_ACTIONS.CLEAR_FILTERS, payload: boolean};
type FilterBySearch = {type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: SearchQueryItem};
type SetCurrentFolder = {type: SEARCH_ACTIONS.SET_CURRENT_FOLDER, payload: string};
type SortByPrice = {type: SEARCH_ACTIONS.SORT_BY, payload: string};

export type SearchActions = ClearFilters | FilterBySearch | SetCurrentFolder | SortByPrice;

export const searchReducer = (state: SearchContextType, action: SearchActions) => {
    switch (action.type) {
        case SEARCH_ACTIONS.CLEAR_FILTERS:
            return { ...state };
        case SEARCH_ACTIONS.FILTER_BY_SEARCH:
            return { ...state, searchQuery: action.payload.searchQuery, searchContent: action.payload.searchContent === true };
        case SEARCH_ACTIONS.SET_CURRENT_FOLDER:
            try {
                let pmSearchSettings = retrieveLocalStorage("privthing.pmSearchSettings") || {};
                pmSearchSettings.currentFolder =  action.payload;
                saveLocalStorage("privthing.pmSearchSettings", pmSearchSettings);
            } catch(e) {
                console.error("Error on SET_CURRENT_FOLDER", e);
            }
            return { ...state, currentFolder: action.payload };
        case SEARCH_ACTIONS.SORT_BY:
            try {
                let pmSearchSettings = retrieveLocalStorage("privthing.pmSearchSettings") || {};
                pmSearchSettings.sort =  action.payload;
                saveLocalStorage("privthing.pmSearchSettings", pmSearchSettings);
            } catch(e) {
                console.error("Error on SET_CURRENT_FOLDER", e);
            }
            return { ...state, sort: action.payload };
        default:
            return state;
    }
};

export enum SETTINGS_ACTIONS {
    UPDATE_SETTINGS = 'UPDATE_SETTINGS'
}
type UpdateSettings = {type: SETTINGS_ACTIONS.UPDATE_SETTINGS, payload: SettingsContextType};

export type SettingsActions = UpdateSettings;

export const settingsReducer = (state: SettingsContextType, action: SettingsActions) => {
    switch (action.type) {
        case SETTINGS_ACTIONS.UPDATE_SETTINGS:
            return {...action.payload};
        default:
            return state;
    }
};

var timeoutUpdatesHandles: LooseObject = {}