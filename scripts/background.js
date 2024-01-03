const corsProxy = 'https://corsproxy.io/?';

chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;

    //queryGoogleWebRiskAPI(url);
    queryURLScanIOSubmit(url);
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
function queryURLScanIOSubmit(url) {
    const apiEndpoint = 'https://urlscan.io/api/v1/scan/';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

    const postData = {
        url: url,
        visibility: 'public',
    }

    fetch((corsProxy + apiEndpoint), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey,
        },
        body: JSON.stringify(postData),
    })
    

    .then(response => response.json())
    .then(data => {
        console.log("Submission to URLScan.IO Successful");
        console.log('URLScan.IO Response:', data);
        if (data.uuid) {
            console.log('URLScan.IO UUID:', data.uuid);
            // A timeout is added for 10 seconds, as per the documentation for the API. //
            setTimeout(queryURLScanIOResult(data.uuid),10000);
        }
    })
    .catch(error => {
        console.error('Error querying URLScan.IO API:', error);
    });
}

function queryURLScanIOResult(uuid)
{
    const apiEndpoint = 'https://urlscan.io/api/v1/result/'+uuid+'/';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

    fetch((corsProxy+apiEndpoint), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey,
        },
    })

    .then(response => response.json())
    .then(data => {
        console.log("Submission to URLScan.IO successful");
        if (data.uuid) {
            console.log('URLScan.IO Response:', data);
            chrome.webNavigation.onBeforeNavigate.addListener(navToBlockPage, { url: [{ urlContains: "blocked.html" }] });
        }
        else {
            throw new Error('UUID not received from URLScan.IO')
        }
    })
    .catch(error => {
        console.error('Error querying URLScan.IO API:', error);
    });
}

/* Navigate the user to the 'Blocked' page. */
function navToBlockPage(details) {
    const redirectURL = chrome.extension.getURL('blockedPage.html');
    chrome.webNavigation.onBeforeNavigate.removeListener(navToBlockPage);
    return { 
        redirectUrl: redirectURL
    };
}