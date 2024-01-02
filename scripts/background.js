chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;

    queryGoogleWebRiskAPI(url);
});

/* Query API 1 - Google Web Risk API */
function queryGoogleWebRiskAPI(url) {
    const apiEndpoint = 'https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAE&uri=http%3A%2F%2Fexample.com&key=AIzaSyArDRynK0K_QY6F8LjVl_Z6Qqvx1Otry6g'

    fetch(apiEndpoint)
    .then(response => response.json())
    .then(data => {
        console.log('Web Risk API Response:', data);
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

function navToBlockPage(details) {
    const redirectURL = chrome.extension.getURL('blockedPage.html');
    chrome.webNavigation.onBeforeNavigate.removeListener(navToBlockPage);
    return { 
        redirectUrl: redirectURL
    };
}