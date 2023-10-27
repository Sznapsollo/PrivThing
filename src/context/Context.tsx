import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, Item, SearchContextType } from '../model';
import { mainReducer, searchReducer } from './Reducers'

const appInitialState = {
  secret: '',
  items: [],
  editedItemCandidate: {} as Item,
  editedItem: {} as Item,
  itemsListRefreshTrigger: 0,
  itemsCss: '',
  homeCss: ''
}
const searchInitialState = {
  sort: 'lastModifiedHighToLow', 
  searchQuery: ""
}

export const AppContext = createContext<{
    mainState: MainContextType,
    mainDispatch: React.Dispatch<any>,
    searchState: SearchContextType,
    searchDispatch: React.Dispatch<any>
}>({
    mainState: appInitialState,
    mainDispatch: () => null,
    searchState: searchInitialState,
    searchDispatch: () => null,
})

type Props = {
    children: React.ReactNode
}

const Context = ({children}: Props) => {

  // appInitialState.secret = 'test';

  const [mainState, mainDispatch] = useReducer(mainReducer, appInitialState);
  const [searchState, searchDispatch] = useReducer(searchReducer, searchInitialState);
  
  return (
    <AppContext.Provider value={{mainState, mainDispatch, searchState, searchDispatch}}> {children} </AppContext.Provider>
  )
}

export const AppState = () => {
  return useContext(AppContext);
};


export default Context
  