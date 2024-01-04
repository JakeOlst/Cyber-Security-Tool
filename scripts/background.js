const tabStates = {};
const corsProxy = 'https://corsproxy.io/?'; // Temp way to bypass CORS restrictions during project //
const exclusionList = ["vimeo.com","youtube.com","google.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //

chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    if (
        (url.startsWith("http") || url.startsWith("https")) && 
        (exclusionList.every(element => !url.includes(element)))) {
        //queryGoogleWebRiskAPI(url, webURL);
        queryURLScanIOSubmit(url);
    }
});

/* Query API 1 - Google Web Risk API */
function queryGoogleWebRiskAPI(url, details) {
    const apiKey = '&key='+'AIzaSyArDRynK0K_QY6F8LjVl_Z6Qqvx1Otry6g';
    const encodedUrl = '&uri='+encodeURIComponent(url);
    const apiEndpoint = `https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE`;

    fetch((apiEndpoint+encodedUrl+apiKey))
    .then(response => response.json())
    .then(data => {
        console.log("Submission to Google Web Risk API Successful");
        console.log('Google Web Risk API Response:', data);
        if (data.threat) {
            const threats = data.threat.threatTypes.join(",");
            navToBlockPage(details,url,threats);
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
            // A timeout is added for 5 seconds, as per the documentation for the API. //
            setTimeout(() => queryURLScanIOResult(data.uuid,url), 10000)
        }
    })
    .catch(error => {
        console.error('Error querying URLScan.IO API:', error);
    });
}

function queryURLScanIOResult(uuid,details)
{
    const maxRetries = 5;
    let retries = 0;
    const apiEndpoint = 'https://urlscan.io/api/v1/result/'+uuid+'/';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

    getResults(uuid);

    function getResults(uuid) {

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
            if (data.verdicts) {
                console.log('URLScan.IO Response:', data);
                if (data.verdicts.urlscan.score < 50) {

                    let categoriesArr = data.verdicts.urlscan.categories;
                    let categories = "NEGATIVE_REPUTATION_SCORE";
                    while (categoriesArr.length > 0) {
                        categories = categories+","+categoriesArr.pop();
                    }
                    
                    navToBlockPage(details,data.page.url,categories);
                }
            }
            else if ((data.status == 404) || (data.status == 200 && !data.verdicts)) {
                console.log("retries:"+retries);
                if (retries <= maxRetries) {
                    console.log('URLScan.IO Results Page not yet ready. Retrying in 3 seconds.')
                    retries++;
                    setTimeout(() => getResults(uuid), 2000)
                }
                else {
                    throw new Error('Error querying URLScan.IO API: Max Retries attempted.');
                }
            }
            else {
                throw new Error('UUID not received from URLScan.IO')
            }

        })
        .catch(error => {
            console.error('Error querying URLScan.IO API:', error);
        });
    }
}

/* Navigate the user to the 'Blocked' page. */
function navToBlockPage(details,url,categories) {
    const redirectURL = chrome.runtime.getURL('blockedPage.html?blockedFromURL=' + url + '&blockCategories='+categories);
    chrome.tabs.update(details.tabId, {
        url: redirectURL
    });
}