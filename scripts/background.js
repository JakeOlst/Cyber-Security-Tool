const tabInfo = {};
const exclusionList = ["vimeo.com","youtube.com","google.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //
let lastNavURL = null;

// The 'score' threshold for URLScan.IO API: -100 (legitimate) to 100 (illegitimate). Default is 30 to avoid false positives.
// Lowering for testing.
const urlScanMinScore = 30;

chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    if (!url.startsWith(lastNavURL)) {
        // Restricts API calls to http/https websites (frame id 0) excluding URLs in the exclusion list.
        if ((url.startsWith("http") || url.startsWith("https")) && (webURL.frameId === 0) && (exclusionList.every(element => !url.includes(element)))) {
            // Initiates the tab states
            tabInfo[tabId] = { 
                navigated: false, 
                urlScanSafeResult: null, 
                googleSafeResult: null,
                urlScanCategories: "",
                googleSafeCategories: ""
            };

            tabInfo[tabId].navigated = false;
            const redirectURL = chrome.runtime.getURL('../pages/querying.html');
            chrome.tabs.update(tabId, { url: redirectURL });
            queryGoogleWebRiskAPI(url, webURL)
            queryURLScanIOSubmit(url, webURL);
        }
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
        console.log("Submission to Google Web Risk API Successful. Response:",data);
        if (data.threat) {
            const threats = data.threat.threatTypes.join(",");
            tabInfo[details.tabId].googleSafeResult = false;
            tabInfo[details.tabId].googleSafeCategories = threats;
            navigateBasedOnAPIResults(details, url, false);
        }
        else {
            tabInfo[details.tabId].googleSafeResult = true;
            navigateBasedOnAPIResults(details, url, true);
        }
    })
    .catch(error => {
        console.error('Error querying Google Web Risk API:', error);
    });
}

/* Query API 2 - URL Scan IO */
function queryURLScanIOSubmit(url,details) {
    const apiEndpoint = 'https://urlscan.io/api/v1/scan/';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

    const postData = {
        url: url,
        visibility: 'public',
    }

    fetch((apiEndpoint), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey,
        },
        body: JSON.stringify(postData),
    })
    

    .then(response => response.json())
    .then(data => {
        console.log("URL successfully submitted to URLScan.io. Response: ",data);
        if (data.uuid) {
            // A timeout is added for 10 seconds, as per the documentation for the API. //
            setTimeout(() => queryURLScanIOResult(data.uuid,details), 10000)
        }
    })
    .catch(error => {
        console.error('There was an error querying URLScan.IO API:', error);
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

        fetch((apiEndpoint), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': apiKey,
            },
        })

        .then(response => response.json())
        .then(data => {
            console.log("Result requested from URLScan.io");
            if (data.verdicts) {
                console.log('URLScan.IO Response:', data);
                // API has a scale of -100 (legitimate) to 100 (illegitimate). However, the score below was chosen to avoid false positives.
                if (data.verdicts.urlscan.score > 30) {
                    tabInfo[details.tabId].urlScanSafeResult = false;
                    let categoriesArr = data.verdicts.urlscan.categories;
                    let categories = "NEGATIVE_REPUTATION_SCORE";
                    while (categoriesArr.length > 0) {
                        categories = categories+","+categoriesArr.pop();
                    }
                    
                    tabInfo[details.tabId].urlScanCategories = categories;
                    navigateBasedOnAPIResults(details, data.page.url, false)
                }
                else {
                    tabInfo[details.tabId].urlScanSafeResult = true;
                    navigateBasedOnAPIResults(details, data.page.url, true)
                }
            }
            else if ((data.status == 404) || (data.status == 200 && !data.verdicts)) {
                console.log("retries:"+retries);
                if (retries <= maxRetries) {
                    console.log('URLScan.IO Results Page not yet ready. Retrying in 3 seconds.')
                    retries++;
                    setTimeout(() => getResults(uuid), 3000)
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

function navigateBasedOnAPIResults(details, url, isSafe) {
    const tabId = details.tabId;
    const googleResult = tabInfo[details.tabId].googleSafeResult !== false;

    awaitResults();

    function awaitResults() {
        if (tabInfo[details.tabId] != undefined) {
            if (tabInfo[details.tabId].navigated) {
                console.log("Navigation Completed.");
                return;
            }
            if (tabInfo[details.tabId].urlScanSafeResult !== null) {
                const urlScanResult = tabInfo[details.tabId].urlScanSafeResult;
                if (googleResult && urlScanResult) {
                    console.log("Website detected as safe. Navigating...");
                    lastNavURL = url;
                    chrome.tabs.update(tabId, { url: url });
                }
                else {
                    let cats = new Set();
                    if (tabInfo[details.tabId].googleSafeCategories !== ""){
                        for (const cat of tabInfo[details.tabId].googleSafeCategories.split(",")) {
                            cats.add(cat)
                        }
                    }
                    if (tabInfo[details.tabId].urlScanCategories !== ""){
                        for (const cat of tabInfo[details.tabId].urlScanCategories.split(",")) {
                            cats.add(cat)
                        }
                    }
                    let categories = Array.from(cats).join(',');
                    console.log("Website detected as unsafe. Redirecting...");
                    const redirectURL = chrome.runtime.getURL('../pages/blockedPage.html?blockedFromURL=' + url + '&blockCategories='+categories);
                    chrome.tabs.update(details.tabId, {
                        url: redirectURL
                    });
                }
                delete tabInfo[details.tabId];
            }
            else {
                console.log("Waiting for response from URLScan.io. Timeout for 1.5 seconds.");
                setTimeout(awaitResults, 1500);
            }
        }

    }
}