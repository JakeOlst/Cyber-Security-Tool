const tabInfo = {};
const exclusionList = ["vimeo.com","youtube.com","google.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //

chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    // Ensures API calls are only made for http and https URLs (websites).
    // Ensures API calls are only made for the websites themselves (frame id 0) and not in-line media.
    // Ensures API calls do not include the URLs on the exclusion list.
    if ((url.startsWith("http") || url.startsWith("https")) && (webURL.frameId === 0) && (exclusionList.every(element => !url.includes(element)))) {
        // Initiates the tab states
        if (!tabInfo[tabId]) {
            tabInfo[tabId] = { 
                navigating: null, 
                urlScanSafeResult: null, 
                googleSafeResult: null,
                urlScanCategories: "",
                googleSafeCategories: ""
            }
        };

        const redirectURL = chrome.runtime.getURL('../pages/querying.html');
        chrome.tabs.update(tabId, { url: redirectURL });

        console.log("OBN Tab ID: "+webURL.tabId);
        queryGoogleWebRiskAPI(url, webURL)
        queryURLScanIOSubmit(url, webURL);
    }
});

/* Query API 1 - Google Web Risk API */
function queryGoogleWebRiskAPI(url, details) {
    const apiKey = '&key='+'AIzaSyArDRynK0K_QY6F8LjVl_Z6Qqvx1Otry6g';
    const encodedUrl = '&uri='+encodeURIComponent(url);
    const apiEndpoint = `https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE`;

    console.log("API1 Tab ID: "+details.tabId);

    fetch((apiEndpoint+encodedUrl+apiKey))
    .then(response => response.json())
    .then(data => {
        console.log("Submission to Google Web Risk API Successful");
        console.log('Google Web Risk API Response:', data);
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

    console.log("API2 Tab ID: "+details.tabId);

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
        console.log("Submission to URLScan.IO Successful");
        console.log('URLScan.IO Response:', data);
        if (data.uuid) {
            console.log('URLScan.IO UUID:', data.uuid);
            // A timeout is added for 6 seconds, as per the documentation for the API. //
            setTimeout(() => queryURLScanIOResult(data.uuid,details), 10000)
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

    console.log("API3 Tab ID: "+details.tabId);


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
            console.log("Submission to URLScan.IO successful");
            if (data.verdicts) {
                console.log('URLScan.IO Response:', data);
                if (data.verdicts.urlscan.score < 50) {
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

    console.log("API4 Tab ID: "+details.tabId);
    console.log("")

    awaitResults();

    function awaitResults() {
        if (tabInfo[details.tabId].urlScanSafeResult !== null) {
            const urlScanResult = tabInfo[details.tabId].urlScanSafeResult;
            if (googleResult && urlScanResult) {
                console.log("Website detected as safe. Navigating...");
                chrome.tabs.update(tabId, { url: url });
                delete tabInfo[details.tabId];
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
                delete tabInfo[details.tabId];

            }
        }
        else {
            console.log("Timeout for 1seconds.");
            setTimeout(awaitResults, 1000);
        }

    }
}