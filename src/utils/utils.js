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