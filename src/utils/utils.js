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
            return false
        }
        window.localStorage.setItem(lsName, btoa(encodeURIComponent(JSON.stringify(data))))
        return true
    } catch(e) {
        var errMsg = 'saveStorageData error for: ' + lsName
        console.warn(errMsg, e)
        return false
    }
}

export function toPersistable(item) {
    if(!item) {
        return item
    }
    const { rawNote, ...persistableItem } = item;
    return persistableItem
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
        "hintHide",
        "hintPassword",
        "hintRowClick",
        "hintRightClickList",
        "hintThemes"
    ]
    var randomHint = Math.floor(Math.random()*hints.length);
    return hints[randomHint];
}

export function manageEditItemSpaces(stateEditedItemSpace, editItemPayload) {
    let editedItemSpaces = stateEditedItemSpace || [];
    if(!editedItemSpaces.length) {
        editedItemSpaces = [{...getNewItem(), spaceId: makeId(10), isActive: true}]
    }
    let activeEditedSpaceIndex = editedItemSpaces.findIndex((editedItemSpace) => editedItemSpace.isActive);
    if(activeEditedSpaceIndex < 0) {activeEditedSpaceIndex = 0;}
    editedItemSpaces = editedItemSpaces.map((editedItemSpaceItem, editedItemSpaceItemIndex) => {
        if(editedItemSpaceItemIndex === activeEditedSpaceIndex) {
            return {...editItemPayload, spaceId: editedItemSpaceItem.spaceId || makeId(10), flex: editedItemSpaceItem.flex,isActive: true};
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
            if(tabPayLoad.path) {
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