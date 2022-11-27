const fallbackLink = 'https://tomas.konir.tech/ttd-test/'

export async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);
    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function getAuth() {
    let storage = window.localStorage
    let ret = undefined
    if (storage !== null) {
        let login = storage.getItem('login')
        let token = storage.getItem('token')
        if (login !== undefined && login !== '' && token !== undefined && token !== '') {
            ret = { 'X-AUTH': login + ':' + token }            
        }
    }
    return (ret)
}

export async function setAuth(login, password, callback) {
    let storage = window.localStorage
    if (storage !== null) {
        const token = await sha256(login + password)
        storage.setItem('login', login)
        storage.setItem('token', token)
    }
    if (callback) {
        callback()
    }
}

export function clearAuth() {
    let storage = window.localStorage
    if (storage !== null) {
        storage.setItem('login', '')
        storage.setItem('token', '')
    }
}

export function getData(link, callback, errCallback) {
    if (window.location.host === 'localhost:3000') {
        link = fallbackLink + link
    }
    fetch(
        link,
        {
            method: 'GET',
            headers: getAuth(),
        }
    ).then(
        response => {
            if (response.status === 200) {
                callback(response)
            } else if (errCallback) {
                errCallback(response.status)
            }
        }
    ).catch(
        error => {
            console.error('error:', error)
            if (errCallback) {
                errCallback(666);
            }
        }
    );
}

export function getJSON(link, callback, errCallback) {
    getData(link, (response) => {
        response.json().then(
            json => {
                callback(json)
            }
        ).catch(
            error => {
                console.error('error:', error)
                if (errCallback) {
                    errCallback(666);
                }
            }
        )
    }, errCallback)
}

export function postData(link, data, callback, errCallback) {
    let cors = 'same-origin'
    if (window.location.host === 'localhost:3000') {
        link = fallbackLink + link
        cors = 'no-cors'
    }
    fetch(
        link,
        {
            method: 'POST',
            mode: cors,
            headers: {
                'Content-Type': 'text/plain',
                ...getAuth()
            },
            body: data
        }
    ).then(
        response => {
            if (response.status === 200) {
                callback(response)
            } else if (errCallback) {
                errCallback(response)
            }
        }
    ).catch(
        error => {
            console.error('error:', error)
            if (errCallback) {
                errCallback(666);
            }
        }
    );
}
