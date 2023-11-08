import Cookies from 'universal-cookie';

export function saveCookie(cookieName, cookieData) {
    try {
        const cookies = new Cookies();
        cookies.set(cookieName, btoa(JSON.stringify(cookieData)), { path: '/' });
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
        return JSON.parse(atob(cookieData));
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
        return lsData ? JSON.parse(atob(lsData)) : null;
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
        window.localStorage.setItem(lsName, btoa(JSON.stringify(data)))
    } catch(e) {
        var errMsg = 'saveStorageData error for: ' + lsName
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