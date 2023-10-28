import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, Item, SearchContextType, SettingsContextType } from '../model';
import { mainReducer, searchReducer, settingsReducer } from './Reducers'
import { retrieveCookie, cloneProps } from '../helpers/helpers'

const appInitialState = {
  secret: '',
  editedItemCandidate: {} as Item,
  editedItem: {} as Item,
  homeCss: '',
  items: [],
  itemsListRefreshTrigger: 0,
  itemsCss: '',
  showSettings: false
}
const searchInitialState = {
  sort: 'lastModifiedHighToLow', 
  searchQuery: ""
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
    let pmSettings = retrieveCookie("pmSettings");
    if(pmSettings) {
        cloneProps(pmSettings, settingsInitialState);
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
  