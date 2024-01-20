import Cookies from 'universal-cookie';

export function saveCookie(cookieName, cookieData) {
    try {
        const cookies = new Cookies();
        cookies.set(cookieName, btoa(encodeURIComponent(JSON.stringify(cookieData))), { path: '/' });
    } catch(e) {
        console.warn("saveCookie error")
    }
}

export function retrieveCookie(cookieName) {
    try {
        const cookies = new Cookies();
        let cookieData = cookies.get(cookieName);
        if(!cookieData) {
            return null
        }
        return JSON.parse(decodeURIComponent(atob(cookieData)));
    } catch(e) {
        console.warn("retrieveCookie error")
    }
    return null
}

export function retrieveLocalStorage(lsName) {
    try {
        if(!window.localStorage) {
            return null
        }
        let lsData = window.localStorage.getItem(lsName)
        return lsData ? JSON.parse(decodeURIComponent(atob(lsData))) : null;
    } catch(e) {
        var errMsg = 'getLocalStorageData error for: ' + lsName
        console.warn(errMsg)
    }
    return null
}

export function saveLocalStorage(lsName, data) {
    try {
        if(!window.localStorage) {
            return null
        }
        window.localStorage.setItem(lsName, btoa(encodeURIComponent(JSON.stringify(data))))
    } catch(e) {
        var errMsg = 'saveStorageData error for: ' + lsName
        console.warn(errMsg)
    }
}

export function removeLocalStorage(lsName) {
    try {
        if(!window.localStorage) {
            return null
        }
        window.localStorage.removeItem(lsName)
    } catch(e) {
        var errMsg = 'removeLocalStorage error for: ' + lsName
        console.warn(errMsg)
    }
}

export function cloneProps(obj1, obj2) {
    try {
        // NJ shallow copy
        for(var prop in obj1) {
            obj2[prop] = obj1[prop]    
        }
    } catch(e) {
        console.warn("cloneProps error")
    }
    return null
}

export function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export function getNewItem() {
    return {
        name: '',
        path: '',
        size: 0,
        rawNote: undefined
    };
}

export function getRandomHint() {
    let hints = [
        "hintCtrlS",
        "hintDisable",
        "hintExportImport",
        "hintPassword",
        "hintRowClick",
        "hintRightClickList"
    ]
    var randomHint = Math.floor(Math.random()*hints.length);
    return hints[randomHint];
}

export function manageEditItemSpaces(stateEditedItemSpace, editItemPayload) {
    let editedItemSpaces = stateEditedItemSpace || [];
    if(!editedItemSpaces.length) {
        editedItemSpaces = [{...getNewItem(), isActive: true}]
    }
    let activeEditedSpaceIndex = editedItemSpaces.findIndex((editedItemSpace) => editedItemSpace.isActive);
    if(activeEditedSpaceIndex < 0) {activeEditedSpaceIndex = 0;}
    editedItemSpaces = editedItemSpaces.map((editedItemSpaceItem, editedItemSpaceItemIndex) => {
        if(editedItemSpaceItemIndex === activeEditedSpaceIndex) {
            return {...editItemPayload, flex: editedItemSpaceItem.flex,isActive: true};
        }
        return {...editedItemSpaceItem, isActive: false};
    })
    return editedItemSpaces
}

export function manageHeaderTabs(tabs, itemPayload, tabPayLoad, mode) {
    let activeTabIndex = -1;

    if(mode === 'CHANGE_ACTIVE' && !tabPayLoad) {
        tabPayLoad = {
            ...itemPayload,
            isNew: true
        }
    }

    if(!tabs.length) {
        tabs.push({...itemPayload, tabId: makeId(10)});
        activeTabIndex = tabs.length - 1;
    } else if(tabPayLoad) {
        if(tabPayLoad.isNew) {
            if(tabPayLoad.path != null) {
                activeTabIndex = tabs.findIndex((tab) => tab.path === tabPayLoad?.path);
            }
            if(activeTabIndex < 0) {
                tabs.push({...itemPayload, tabId: makeId(10)});
                activeTabIndex = tabs.length - 1;
            }
        } else if(tabPayLoad?.tabId) {
            activeTabIndex = tabs.findIndex((tab) => tab.tabId === tabPayLoad?.tabId);
        }
    } else {
        // NJ when adding new for example
        activeTabIndex = tabs.findIndex((tab) => tab.isActive === true);
    }

    if(activeTabIndex < 0) {activeTabIndex = 0;}
    tabs = tabs.map((tabItem, tabItemIndex) => {
        if(tabItemIndex === activeTabIndex) {
            return {...itemPayload, tabId: tabItem.tabId, scrollTop: tabItem.scrollTop, isActive: true};
        }
        return {...tabItem, isActive: false};
    })
    return tabs
}