import { storeBlockDetails } from "./storeBlockDetailsModule.js";
import { bankingWebsiteDetected } from "../background.js";

const maxRetries = 8;

function navigateBasedOnAPIResults(details, url, isSafe, tabInfo, lastNavURL) {
    const tabId = details.tabId;
    const googleResult = tabInfo[details.tabId].googleSafeResult !== false;

    let retries = 0;

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
                    browser.storage.local.set({ 'lastNavURL': lastNavURL }, function () {
                        console.log("Last Nav URL: "+lastNavURL);
                        browser.tabs.update(tabId, { url: url });
                    });
                    fetch(browser.runtime.getURL('../config/bankingWebsites.json'))
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
                    const redirectURL = browser.runtime.getURL('../pages/blockedPage.html?blockedFromURL='
                     + url + '&blockCategories='+categories);

                     browser.tabs.update(tabId, { url: redirectURL });
                }

                delete tabInfo[details.tabId];
            }
            else {
                    if (retries <= maxRetries) {
                        console.log("Waiting for response from URLScan.IO. Timeout for 2 seconds. "+(maxRetries-retries)+" retries remaining.");
                        retries++;
                        setTimeout(getResults, 2000);
                    }
                    else {
                        throw new Error('Error waiting for URLScan.IO: Max Retries attempted.');
                    }
            }
        }

    }
}

export {
    navigateBasedOnAPIResults
};