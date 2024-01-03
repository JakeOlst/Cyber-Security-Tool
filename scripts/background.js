chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;

    queryGoogleWebRiskAPI(url);
});

/* Query API 1 - Google Web Risk API */
function queryGoogleWebRiskAPI(url) {
    const apiKey = '&key='+'AIzaSyArDRynK0K_QY6F8LjVl_Z6Qqvx1Otry6g';
    const encodedUrl = '&uri='+encodeURIComponent(url);
    const apiEndpoint = `https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE`;

    fetch((apiEndpoint+encodedUrl+apiKey))
    .then(response => response.json())
    .then(data => {
        console.log("Submission to Google Web Risk API Successful");
        console.log('Google Web Risk API Response:', data);
        if (data.threat) {
            const navURL = url;
            // Adds new listener //
            chrome.webNavigation.onBeforeNavigate.addListener(navToBlockPage, { url: [{ urlContains: "blocked.html" }] });
        }
    })
    .catch(error => {
        console.error('Error querying Google Web Risk API:', error);
    });
}

/* Query API 2 - URL Scan IO */
function queryURLScanIO(url) {
    const apiEndpoint = 'https://urlscan.io/api/v1/search/?q=';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

    const postData = {
        url: encodeURIComponent(url),
        visibility: 'public',
    }

    fetch((apiEndpoint+encodedUrl), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey;
        },
        body: JSON.stringify(postData),
    })
    

    .then(response => response.json())
    .then(data => {
        console.log("Submission to Google Web Risk API Successful");
        if (data.uuid) {
            console.log('Google Web Risk API Response:', data);
            chrome.webNavigation.onBeforeNavigate.addListener(navToBlockPage, { url: [{ urlContains: "blocked.html" }] });
        }
        }
    })
    .catch(error => {
        console.error('Error querying Google Web Risk API:', error);
    });
}

function navToBlockPage(details) {
    const redirectURL = chrome.extension.getURL('blockedPage.html');
    chrome.webNavigation.onBeforeNavigate.removeListener(navToBlockPage);
    return { 
        redirectUrl: redirectURL
    };
}