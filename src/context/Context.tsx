import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, Item, NavigationItem, SearchContextType, SettingsContextType, Tab, EditItem } from '../model';
import { mainReducer, searchReducer, settingsReducer } from './Reducers'
import { retrieveLocalStorage, cloneProps, makeId } from '../utils/utils'

const appInitialState: MainContextType = {
  secret: '',
  editedItemCandidate: {} as NavigationItem,
  editedItemTabs: [{isActive: true}] as EditItem[],
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
        let activeTab = null;
        if(pmTabs && Array.isArray(pmTabs)) {
            appInitialState.tabs = pmTabs.map((pmTab) => {
                if(!pmTab.tabId) {
                    pmTab.tabId = makeId(10);
                }
                if(pmTab.isActive) {
                    activeTab = pmTab;
                }
                // pmTab.isActive = false;
                return pmTab
            })
        }
        if(activeTab) {
            appInitialState.editedItemTabs = [{...activeTab as Item, isActive: true} as EditItem];
            appInitialState.activeEditedItemPath = (activeTab as Item).path;
        }
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
  