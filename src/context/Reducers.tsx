
import { AlertData, Item, NavigationItem, Tab, MainContextType, NotificationData, SearchContextType, SettingsContextType, Folder, ProcessingResult } from '../model'
import { makeId, retrieveLocalStorage, saveLocalStorage } from '../utils/utils'

export enum MAIN_ACTIONS {
    HIDE_ITEMS_BAR = 'HIDE_ITEMS_BAR',
    HIDE_SETTINGS = 'HIDE_SETTINGS',
    LOAD_FROM_PICKED_FILE = 'LOAD_FROM_PICKED_FILE',
    SET_EDITED_ITEM_CANDIDATE = 'SET_EDITED_ITEM_CANDIDATE',
    SET_EDITED_ITEM = 'SET_EDITED_ITEM',
    CLEAR_EDITED_ITEM = 'CLEAR_EDITED_ITEM',
    CLEAR_SECRET = 'CLEAR_SECRET',
    SET_ITEMS = 'SET_ITEMS',
    SHOW_ALERT_MODAL = 'SHOW_ALERT_MODAL',
    SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',
    SHOW_SETTINGS = 'SHOW_SETTINGS',
    TOGGLE_ITEMS_BAR = 'TOGGLE_ITEMS_BAR',
    UPDATE_ITEMS_LIST = 'UPDATE_ITEMS_LIST',
    UPDATE_TABS = 'UPDATE_TABS',
    UPDATE_SECRET = 'UPDATE_SECRET'
}

type HideItemsBar = {type: MAIN_ACTIONS.HIDE_ITEMS_BAR};
type HideSettings = {type: MAIN_ACTIONS.HIDE_SETTINGS};
type LoadFromPickedFile = {type: MAIN_ACTIONS.LOAD_FROM_PICKED_FILE, payload: any};
type SetEditedItemCandidatel = {type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: NavigationItem};
type SetEditedItem = {type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: NavigationItem};
type ClearEditedItem = {type: MAIN_ACTIONS.CLEAR_EDITED_ITEM};
type ClearSecret = {type: MAIN_ACTIONS.CLEAR_SECRET};
type SetItems = {type: MAIN_ACTIONS.SET_ITEMS, payload: Item[]};
type ShowAlertModal = {type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: AlertData};
type ShowNotification = {type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: NotificationData};
type ShowSettings = {type: MAIN_ACTIONS.SHOW_SETTINGS};
type ToggleItemsBar = {type: MAIN_ACTIONS.TOGGLE_ITEMS_BAR};
type UpdateItemsList = {type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: string};
type UpdateTabs = {type: MAIN_ACTIONS.UPDATE_TABS, payload: Tab[]};
type UpdateSecret = {type: MAIN_ACTIONS.UPDATE_SECRET, payload: string};

export type MainActions = ClearEditedItem |
    ClearSecret | 
    HideItemsBar | 
    HideSettings |
    LoadFromPickedFile | 
    SetEditedItemCandidatel | 
    SetEditedItem | 
    SetItems | 
    ShowAlertModal | 
    ShowNotification |
    ShowSettings |
    ToggleItemsBar | 
    UpdateItemsList | 
    UpdateTabs |
    UpdateSecret;

export const mainReducer = (state: MainContextType, action: MainActions) => {
    // console.log('mainReducer', action.type)
    switch (action.type) {
        case MAIN_ACTIONS.HIDE_ITEMS_BAR:
            return { ...state, fullItems: false};
        case MAIN_ACTIONS.HIDE_SETTINGS:
            return { ...state, showSettings: false };
        case MAIN_ACTIONS.LOAD_FROM_PICKED_FILE:
            return { ...state, pickedFileEvent: action.payload };
        case MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE:
            return { ...state, editedItemCandidate: action.payload, fullItems: false };
        case MAIN_ACTIONS.SET_EDITED_ITEM:
            if(!action.payload.item) {
                // console.log('No item in payload')
                return {...state}
            }
            
            let itemPayload = {...action.payload.item};
            let tabPayLoad = action.payload.tab;
            let updatedTabs: Tab[] = state.tabs.slice() || []
            let activeTabIndex = -1;
            
            if(action.payload.action === "REMOVE_TAB" && action.payload.tab) {
                let tabToBeRemovedIndex = updatedTabs.findIndex((tab) => tab.tabId === tabPayLoad?.tabId);
                if(tabToBeRemovedIndex < 0 ) {
                    return {...state}
                }
                let tabToBeRemoved = updatedTabs[tabToBeRemovedIndex];

                if(!tabToBeRemoved.active) {
                    return {...state, tabs: updatedTabs.filter((item, index) => index !== tabToBeRemovedIndex)}
                } else {
                    if(tabToBeRemovedIndex > 0) {
                        updatedTabs[tabToBeRemovedIndex-1].active = true;
                        itemPayload = updatedTabs[tabToBeRemovedIndex-1];
                        tabPayLoad = undefined;
                    } else if(tabToBeRemovedIndex === 0 && updatedTabs.length > 1) {
                        updatedTabs[tabToBeRemovedIndex+1].active = true;
                        itemPayload = updatedTabs[tabToBeRemovedIndex+1];
                        tabPayLoad = undefined;
                    }
                    updatedTabs = updatedTabs.filter((item, index) => index !== tabToBeRemovedIndex);
                }
            }
            if(!updatedTabs.length) {
                updatedTabs.push({...itemPayload, tabId: makeId(10)});
                activeTabIndex = updatedTabs.length - 1;
            } else if(tabPayLoad) {
                if(tabPayLoad.isNew) {
                    if(tabPayLoad.path) {
                        activeTabIndex = updatedTabs.findIndex((tab) => tab.path === tabPayLoad?.path);
                    }
                    if(activeTabIndex < 0) {
                        updatedTabs.push({...itemPayload, tabId: makeId(10)});
                        activeTabIndex = updatedTabs.length - 1;
                    }
                } else if(tabPayLoad?.tabId) {
                    activeTabIndex = updatedTabs.findIndex((tab) => tab.tabId === tabPayLoad?.tabId);
                }
            } else {
                // NJ when adding new for example
                activeTabIndex = updatedTabs.findIndex((tab) => tab.active === true);
            }

            if(activeTabIndex < 0) {activeTabIndex = 0;}
            updatedTabs = updatedTabs.map((tabItem, tabItemIndex) => {
                if(tabItemIndex === activeTabIndex) {
                    return {...itemPayload, tabId: tabItem.tabId, scrollTop: tabItem.scrollTop, active: true};
                }
                return {...tabItem, active: false};
            })
            return { ...state, editedItem: itemPayload, tabs: updatedTabs, newItemToOpen: undefined };
        case MAIN_ACTIONS.CLEAR_EDITED_ITEM:
            const payLoadItem: Item = {
                name: '',
                path: '',
                size: 0,
                rawNote: undefined
            };
            return { ...state, editedItem: payLoadItem };
        case MAIN_ACTIONS.CLEAR_SECRET:
            return { ...state, secret: '' };
        case MAIN_ACTIONS.SET_ITEMS:
            let folders:Folder[] = [];
            let items = [];
            try {
                let localStorageFiles = retrieveLocalStorage('privthing.files');
                if(localStorageFiles) {
                    for(let localStorageFileName in localStorageFiles) {
                        let localStorageFile = localStorageFiles[localStorageFileName]
                        let lcItem: Item = {
                            folder: 'localStorage',
                            path: 'localStorage/' + localStorageFileName,
                            name: localStorageFileName,
                            size: localStorageFile.size,
                            lastModified: localStorageFile.lastModified
                        }
                        items.push(lcItem)
                    }
                }
            } catch(e) {
                alert("Problem retrieving localStorage items")
            }
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
        case MAIN_ACTIONS.TOGGLE_ITEMS_BAR:
            return { ...state, fullItems: !state.fullItems };
        case MAIN_ACTIONS.UPDATE_ITEMS_LIST:
            return { ...state, itemsListRefreshTrigger: new Date().getTime(), newItemToOpen: undefined, newPathToOpenCandidate: action.payload };
        case MAIN_ACTIONS.UPDATE_SECRET:
            return { ...state, secret: action.payload};
        case MAIN_ACTIONS.UPDATE_TABS:
            return { ...state, tabs: action.payload};
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
type FilterBySearch = {type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: string};
type SetCurrentFolder = {type: SEARCH_ACTIONS.SET_CURRENT_FOLDER, payload: string};
type SortByPrice = {type: SEARCH_ACTIONS.SORT_BY, payload: string};

export type SearchActions = ClearFilters | FilterBySearch | SetCurrentFolder | SortByPrice;

export const searchReducer = (state: SearchContextType, action: SearchActions) => {
    switch (action.type) {
        case SEARCH_ACTIONS.CLEAR_FILTERS:
            return { ...state };
        case SEARCH_ACTIONS.FILTER_BY_SEARCH:
            return { ...state, searchQuery: action.payload };
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