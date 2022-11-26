const fallbackLink = 'https://tomas.konir.tech/ttd/'

export function getData(link, callback){
    if (window.location.host === 'localhost:3000') {
        link = fallbackLink + link
    }
    fetch(
        link,
        { method: 'GET' }
    ).then(
        response =>
            callback(response)    
    ).catch(
        error => {
            console.error('error:', error)
        }
    );
}

export function getJSON(link, callback){
    if (window.location.host === 'localhost:3000') {
        link = fallbackLink + link
    }
    fetch(
        link,
        { method: 'GET' }
    ).then(
        response =>
            response.json()
    ).then(
        json => {
            callback(json)
        }
    ).catch(
        error => {
            console.error('error:', error)
        }
    )
}

export function postData(link, data, callback) {
    if (window.location.host === 'localhost:3000') {
        link = fallbackLink + link
    }
    fetch(
        link,
        {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: data
        }
    ).then(
        response => callback(response)
    ).catch(
        error => {
            console.error('error:', error)
        }
    );
}
