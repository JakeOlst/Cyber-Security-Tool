import { storeBlockDetails } from "./storeBlockDetailsModule.js";

function navigateBasedOnAPIResults(details, url, isSafe, tabInfo, lastNavURL) {
    const tabId = details.tabId;
    const googleResult = tabInfo[details.tabId].googleSafeResult !== false;

    getResults();

    function getResults() {
        if (tabInfo[details.tabId] != undefined) {
            if (tabInfo[details.tabId].navigated) {
                console.log("Navigation Completed.");
                return;
            }
            if (tabInfo[details.tabId].urlScanSafeResult !== null) {
                const urlScanResult = tabInfo[details.tabId].urlScanSafeResult;
                lastNavURL = url;
                if (googleResult && urlScanResult) {
                    console.log("Website detected as safe. Navigating...");
                    chrome.storage.local.set({ 'lastNavURL': lastNavURL }, function () {
                        chrome.tabs.update(tabId, { url: url });
                    });
                    fetch(chrome.runtime.getURL('../config/bankingWebsites.json'))
                        .then(response => response.json())
                        .then(data => {
                            const bankingWebsites = data.bankingWebsites; // Access the array property
                            //console.log('Parsed bankingWebsites:', bankingWebsites);
                            const parsedURL = new URL(url);
                            const domainName = parsedURL.hostname.replace(/^(www\.)?(.*?)\..*?$/, '$2');

                            if (bankingWebsites.some(website => website.bankDomainName.includes(domainName))) {
                                bankingWebsiteDetected(domainName);
                            }
                        })
                        .catch(error => {
                            console.error('Error querying bankingWebsites.json:', error);
                        });
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
                    storeBlockDetails(tabId, url, categories);
                    const redirectURL = chrome.runtime.getURL('../pages/blockedPage.html?blockedFromURL='
                     + url + '&blockCategories='+categories);

                    chrome.storage.local.set({ 'lastNavURL': lastNavURL }, function () {
                        chrome.tabs.update(tabId, { url: redirectURL });
                    });
    
                    chrome.storage.local.get('lastNavURL', function(getLastURL) {
                        lastNavURL = getLastURL.lastNavURL || null;
                        if (lastNavURL != null) {
                            console.log('Last Navigated URL:', lastNavURL);
                        }
                        else {
                            console.log('Last Nav URL not found in storage.');
                        }
                    });
                }

                delete tabInfo[details.tabId];
            }
            else {
                console.log("Waiting for response from URLScan.io. Timeout for 1.5 seconds.");
                setTimeout(getResults, 1500);
            }
        }

    }
}

export {
    navigateBasedOnAPIResults
};