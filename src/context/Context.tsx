import React, {createContext, useContext, useReducer} from 'react'
import { MainContextType, NavigationItem, SearchContextType, SettingsContextType, Tab, EditItem } from '../model';
import { mainReducer, searchReducer, settingsReducer } from './Reducers'
import { retrieveLocalStorage, cloneProps, makeId } from '../utils/utils'

const appInitialState: MainContextType = {
  secret: '',
  editedItemCandidate: {} as NavigationItem,
  editedItemSpaces: [] as EditItem[],
  items: [],
  tabs: [],
  folders: [],
  favourites: [],
  itemsListRefreshTrigger: 0,
  fullItems: false,
  showSettings: false,
  showFavourites: false
}
const searchInitialState = {
  sort: 'lastModifiedHighToLow', 
  searchQuery: "",
  currentFolder: ""
}

export const settingsInitialStateBaseline = {
  forgetSecretTime: 300000, 
  forgetSecretMode: "AFTER_TIME",
  enableFileServer: false,
  showHints: true,
  stretchNoteSpaceOnActive: false,
  codeMirrorTheme: 'none',
  customThemeColors: {
        variant: 'light',
        background: '#282a36',
        foreground: '#f0a4f5',
        caret: '#7c3aed',
        selection: 'ffffff1A', // does not seem to work
        lineHighlight: '#ffffff1A',
        gutterBackground: '#282a36',
        gutterForeground: '#6461c9',
        comment: '#ffc800',
        variableName: '#ffffff',
        brace: '#eaff00',
        numberType: '#bd93f9',
        boolType: '#50fa76',
        nullType: '#8be9fd',
        keyWordType: '#ff79c6',
        operatorType: '#ff79c6',
        classNameType: '#8be9fd',
        typeName: '#85e9fd',
        typeName2: '#8be9fd',
        angleBracket: '#ffffff',
        tagName: '#ff79c6',
        attributeName: '#50fa76'
    }
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
        let pmSettings = retrieveLocalStorage("privthing.pmSettings") || {};
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
                if(pmTab.isDragged) {
                    delete pmTab.isDragged // just in case
                }
                // if(pmTab.isActive) {
                //     activeTab = pmTab;
                // }
                // pmTab.isActive = false;
                return pmTab
            })
            let pmeditedItemSpaces = retrieveLocalStorage("privthing.pmeditedItemSpaces");
            if(pmeditedItemSpaces && Array.isArray(pmeditedItemSpaces)) {

                // add only those that are in tabs. 
                // allow only one active just on case

                let activeEditedItemPath: string | undefined;
                pmeditedItemSpaces = pmeditedItemSpaces.filter((pmEditedItem) => {
                    const tabExists = pmTabs.findIndex((pmTab:EditItem) => pmTab.path === pmEditedItem.path) >= 0
                    if(tabExists) {
                        if(pmEditedItem.isActive) {
                            if(!activeEditedItemPath) {
                                activeEditedItemPath = pmEditedItem.path;
                                if(pmSettings.stretchNoteSpaceOnActive === true) {
                                    pmEditedItem.flex = 2;
                                }
                            } else {
                                pmEditedItem.isActive = false;
                            }
                        }
                        return true
                    }
                    return false
                })
                if(!!pmeditedItemSpaces) {
                    appInitialState.editedItemSpaces = pmeditedItemSpaces;
                    if(activeEditedItemPath) {
                        appInitialState.activeEditedItemPath = activeEditedItemPath;
                    }
                }
                
            }

            let pmfavourites = retrieveLocalStorage("privthing.pmfavourites");
            if(pmfavourites && Array.isArray(pmfavourites)) {
                if(!!pmfavourites) {
                    appInitialState.favourites = pmfavourites;
                }
                
            }
        }
        if(!appInitialState.editedItemSpaces || !appInitialState.editedItemSpaces.length) {
            appInitialState.editedItemSpaces = [{isActive: true} as EditItem];
        }

        // if(activeTab) {
        //     appInitialState.editedItemSpaces = [{...activeTab as Item, isActive: true} as EditItem];
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
        <AppContext.Provider value={{
            mainState, 
            mainDispatch, 
            searchState, 
            searchDispatch, 
            settingsState, 
            settingsDispatch
        }}> {children} </AppContext.Provider>
    )
}

export const AppState = () => {
  return useContext(AppContext);
};


export default Context
  