import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, Item, NavigationItem, SearchContextType, SettingsContextType, Tab } from '../model';
import { mainReducer, searchReducer, settingsReducer } from './Reducers'
import { retrieveCookie, retrieveLocalStorage, cloneProps } from '../helpers/helpers'

const appInitialState: MainContextType = {
  secret: '',
  editedItemCandidate: {} as NavigationItem,
  editedItem: {} as Item,
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

const settingsInitialState = {
  forgetSecretTime: 300000, 
  forgetSecretMode: "AFTER_TIME"
}

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
        let pmSettings = retrieveCookie("pmSettings");
        if(pmSettings) {
            cloneProps(pmSettings, settingsInitialState);
        }

        let pmTabs = retrieveLocalStorage("pmTabs");
        if(pmTabs && Array.isArray(pmTabs)) {
            appInitialState.tabs = pmTabs.map((pmTab) => {
                pmTab.active = false;
                return pmTab
            })
        }
    } catch(e) {
        console.warn("Defaults restore error", e);
    }

    let pmSearchSettings = retrieveCookie("pmSearchSettings");
    if(pmSearchSettings?.sort) {
        searchInitialState.sort = pmSearchSettings?.sort;
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
  