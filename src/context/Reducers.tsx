
import { AlertData, Item, NavigationItem, Tab, MainContextType, NotificationData, SearchContextType, SettingsContextType, Folder } from '../model'
import { makeId, retrieveLocalStorage, saveLocalStorage } from '../utils/utils'

type HideItemsBar = {type: 'HIDE_ITEMS_BAR'};
type HideSettings = {type: 'HIDE_SETTINGS'};
type LoadFromPickedFile = {type: 'LOAD_FROM_PICKED_FILE', payload: any};
type SetEditedItemCandidatel = {type: 'SET_EDITED_ITEM_CANDIDATE', payload: NavigationItem};
type SetEditedItem = {type: 'SET_EDITED_ITEM', payload: NavigationItem};
type ClearEditedItem = {type: 'CLEAR_EDITED_ITEM'};
type ClearSecret = {type: 'CLEAR_SECRET'};
type SetItems = {type: 'SET_ITEMS', payload: Item[]};
type ShowAlertModal = {type: 'SHOW_ALERT_MODAL', payload: AlertData};
type ShowNotification = {type: 'SHOW_NOTIFICATION', payload: NotificationData};
type ShowSettings = {type: 'SHOW_SETTINGS'};
type ToggleItemsBar = {type: 'TOGGLE_ITEMS_BAR'};
type UpdateItemsList = {type: 'UPDATE_ITEMS_LIST', payload: string};
type UpdateTabs = {type: 'UPDATE_TABS', payload: Tab[]};
type UpdateSecret = {type: 'UPDATE_SECRET', payload: string};

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
        case "HIDE_ITEMS_BAR":
            return { ...state, fullItems: false};
        case "HIDE_SETTINGS":
            return { ...state, showSettings: false };
        case "LOAD_FROM_PICKED_FILE":
            return { ...state, pickedFileEvent: action.payload };
        case "SET_EDITED_ITEM_CANDIDATE":
            return { ...state, editedItemCandidate: action.payload, fullItems: false };
        case "SET_EDITED_ITEM":
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
        case "CLEAR_EDITED_ITEM":
            const payLoadItem: Item = {
                name: '',
                path: '',
                size: 0,
                rawNote: undefined
            };
            return { ...state, editedItem: payLoadItem };
        case "CLEAR_SECRET":
            return { ...state, secret: '' };
        case "SET_ITEMS":
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
        case "SHOW_SETTINGS":
            return { ...state, showSettings: true };
        case "SHOW_ALERT_MODAL":
            return { ...state, alertData: action.payload };
        case "SHOW_NOTIFICATION":
            return { ...state, notificationData: action.payload };
        case "TOGGLE_ITEMS_BAR":
            return { ...state, fullItems: !state.fullItems };
        case "UPDATE_ITEMS_LIST":
            return { ...state, itemsListRefreshTrigger: new Date().getTime(), newItemToOpen: undefined, newPathToOpenCandidate: action.payload };
        case "UPDATE_SECRET":
            return { ...state, secret: action.payload};
        case "UPDATE_TABS":
            return { ...state, tabs: action.payload};
        default:
            return state;
    }
};

type ClearFilters = {type: 'CLEAR_FILTERS', payload: boolean};
type FilterBySearch = {type: 'FILTER_BY_SEARCH', payload: string};
type SetCurrentFolder = {type: 'SET_CURRENT_FOLDER', payload: string};
type SortByPrice = {type: 'SORT_BY', payload: string};

export type SearchActions = ClearFilters | FilterBySearch | SetCurrentFolder | SortByPrice;

export const searchReducer = (state: SearchContextType, action: SearchActions) => {
    switch (action.type) {
        case "CLEAR_FILTERS":
            return { ...state };
        case "FILTER_BY_SEARCH":
            return { ...state, searchQuery: action.payload };
        case "SET_CURRENT_FOLDER":
            try {
                let pmSearchSettings = retrieveLocalStorage("privthing.pmSearchSettings") || {};
                pmSearchSettings.currentFolder =  action.payload;
                saveLocalStorage("privthing.pmSearchSettings", pmSearchSettings);
            } catch(e) {
                console.error("Error on SET_CURRENT_FOLDER", e);
            }
            return { ...state, currentFolder: action.payload };
        case "SORT_BY":
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

type UpdateSettings = {type: 'UPDATE_SETTINGS', payload: SettingsContextType};

export type SettingsActions = UpdateSettings;

export const settingsReducer = (state: SettingsContextType, action: SettingsActions) => {
    switch (action.type) {
        case "UPDATE_SETTINGS":
            return {...action.payload};
        default:
            return state;
    }
};