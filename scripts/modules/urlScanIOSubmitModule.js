import { queryURLScanIOResult } from "./urlScanIOResultModule.js";
import { navigateBasedOnAPIResults } from "./resultNavigationModule.js";

function queryURLScanIOSubmit(url, details, tabInfo, lastNavURL) {
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
        if (data.uuid) {
            console.log("URL successfully submitted to URLScan.io. Response: ",data);
            setTimeout(() => queryURLScanIOResult(data.uuid, details, tabInfo, lastNavURL), 10000)
        }
        else {
            if (data.status == 400 && data.message == "Scan prevented ...") {
                console.log("Scan prevented by API (Allowlist)...");
                tabInfo[details.tabId].urlScanSafeResult = true;
                navigateBasedOnAPIResults(details, url, true, tabInfo, lastNavURL)
            }
            else if (data.status == 400 && data.message == "DNS Error - Could not resolve domain") {
                console.log("Scan prevented by API (Domain does not Exist)");
                const redirectURL = chrome.runtime.getURL('../pages/unknownWebsite.html?blockedFromURL='+ url);

                    chrome.storage.local.set({ 'lastNavURL': lastNavURL }, function () {
                        chrome.tabs.update(details.tabId, { url: redirectURL });
                    });
            }
        }
    })
    .catch(error => {
        console.error('There was an error querying URLScan.IO API:', error);
    });
}

export {
    queryURLScanIOSubmit
};