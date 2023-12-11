import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, NavigationItem, SearchContextType, SettingsContextType, Tab, EditItem } from '../model';
import { mainReducer, searchReducer, settingsReducer } from './Reducers'
import { retrieveLocalStorage, cloneProps, makeId } from '../utils/utils'

const appInitialState: MainContextType = {
  secret: '',
  editedItemCandidate: {} as NavigationItem,
  editedItemTabs: [] as EditItem[],
  items: [],
  tabs: [],
  folders: [],
  itemsListRefreshTrigger: 0,
  fullItems: false,
  showSettings: false
}
const searchInitialState = {
  sort: 'lastModifiedHighToLow', 
  searchQuery: "",
  currentFolder: ""
}

export const settingsInitialStateBaseline = {
  forgetSecretTime: 300000, 
  forgetSecretMode: "AFTER_TIME",
  enableFileServer: false
}

var settingsInitialState = {...settingsInitialStateBaseline}

export const AppContext = createContext<{
    mainState: MainContextType,
    mainDispatch: React.Dispatch<any>,
    searchState: SearchContextType,
    searchDispatch: React.Dispatch<any>,
    settingsState: SettingsContextType,
    settingsDispatch: React.Dispatch<any>
}>({
    mainState: appInitialState,
    mainDispatch: () => null,
    searchState: searchInitialState,
    searchDispatch: () => null,
    settingsState: settingsInitialState,
    settingsDispatch: () => null
})

type Props = {
    children: React.ReactNode
}

const Context = ({children}: Props) => {

  // appInitialState.secret = 'test';

    // if(settingsInitialState.forgetSecretTime) {
    //     settingsInitialState.forgetSecretTime = 120000;
    // }
    try {
        let pmSettings = retrieveLocalStorage("privthing.pmSettings");
        if(pmSettings) {
            cloneProps(pmSettings, settingsInitialState);
        } else {
            // for demo
            // cloneProps({enableFileServer: true}, settingsInitialState);
        }

        let pmTabs = retrieveLocalStorage("privthing.pmTabs");
        // let activeTab = null;
        if(pmTabs && Array.isArray(pmTabs)) {
            appInitialState.tabs = pmTabs.map((pmTab:Tab) => {
                if(!pmTab.tabId) {
                    pmTab.tabId = makeId(10);
                }
                // if(pmTab.isActive) {
                //     activeTab = pmTab;
                // }
                // pmTab.isActive = false;
                return pmTab
            })
            let pmEditedItemTabs = retrieveLocalStorage("privthing.pmEditedItemTabs");
            if(pmEditedItemTabs && Array.isArray(pmEditedItemTabs)) {

                // add only those that are in tabs. 
                // allow only one active just on case

                let activeEditedItemPath: string | undefined;
                pmEditedItemTabs = pmEditedItemTabs.filter((pmEditedItem) => {
                    const tabExists = pmTabs.findIndex((pmTab:EditItem) => pmTab.path === pmEditedItem.path) >= 0
                    if(tabExists) {
                        if(pmEditedItem.isActive) {
                            if(!activeEditedItemPath) {
                                activeEditedItemPath = pmEditedItem.path;
                            } else {
                                pmEditedItem.isActive = false;
                            }
                        }
                        return true
                    }
                    return false
                })
                if(!!pmEditedItemTabs) {
                    appInitialState.editedItemTabs = pmEditedItemTabs;
                    if(activeEditedItemPath) {
                        appInitialState.activeEditedItemPath = activeEditedItemPath;
                    }
                }
                
            }
        }
        if(!appInitialState.editedItemTabs || !appInitialState.editedItemTabs.length) {
            appInitialState.editedItemTabs = [{isActive: true} as EditItem];
        }

        // if(activeTab) {
        //     appInitialState.editedItemTabs = [{...activeTab as Item, isActive: true} as EditItem];
        //     appInitialState.activeEditedItemPath = (activeTab as Item).path;
        // }
    } catch(e) {
        console.warn("Defaults restore error", e);
    }

    let pmSearchSettings = retrieveLocalStorage("privthing.pmSearchSettings");
    if(pmSearchSettings?.sort) {
        searchInitialState.sort = pmSearchSettings?.sort;
    }
    if(pmSearchSettings?.currentFolder) {
        searchInitialState.currentFolder = pmSearchSettings?.currentFolder;
    }

    const [mainState, mainDispatch] = useReducer(mainReducer, appInitialState);
    const [searchState, searchDispatch] = useReducer(searchReducer, searchInitialState);
    const [settingsState, settingsDispatch] = useReducer(settingsReducer, settingsInitialState);

    return (
        <AppContext.Provider value={{mainState, mainDispatch, searchState, searchDispatch, settingsState, settingsDispatch}}> {children} </AppContext.Provider>
    )
}

export const AppState = () => {
  return useContext(AppContext);
};


export default Context
  