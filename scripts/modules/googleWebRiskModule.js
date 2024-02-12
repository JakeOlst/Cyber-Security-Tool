import { navigateBasedOnAPIResults } from "./resultNavigationModule.js";

/* Query API 1 - Google Web Risk API */
function queryGoogleWebRiskAPI(url, details, tabInfo, lastNavURL) {
    const apiKey = '&key='+'AIzaSyArDRynK0K_QY6F8LjVl_Z6Qqvx1Otry6g';
    const encodedUrl = '&uri='+encodeURIComponent(url);
    const apiEndpoint = 'https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE'

    fetch((apiEndpoint+encodedUrl+apiKey))
    .then(response => response.json())
    .then(data => {
        console.log("Submission to Google Web Risk API Successful. Response:",data);
        if (data.threat) {
            const threats = data.threat.threatTypes.join(",");
            tabInfo[details.tabId].googleSafeResult = false;
            tabInfo[details.tabId].googleSafeCategories = threats;
            navigateBasedOnAPIResults(details, url, false, tabInfo, lastNavURL);
        }
        else {
            tabInfo[details.tabId].googleSafeResult = true
            //console.log(tabInfo[details.tabId].googleSafeResult);
            navigateBasedOnAPIResults(details, url, true, tabInfo, lastNavURL );
        }
    })
    .catch(error => {
        console.error('Error querying Google Web Risk API:', error);
    });
}

export {
    queryGoogleWebRiskAPI
};