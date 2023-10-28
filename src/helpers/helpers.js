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