import { queryGoogleWebRiskAPI } from "./modules/googleWebRiskModule.js";
import { queryURLScanIOSubmit } from "./modules/urlScanIOSubmitModule.js";

const tabInfo = {};
const exclusionList = ["vimeo.com","youtube.com","google.com","msn.com","bing.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //
let lastNavURL = null;

browser.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    browser.storage.local.get('lastNavURL', function(getLastURL) {
        const lastNavURL = getLastURL.lastNavURL || null;

        if (!lastNavURL || (!url.startsWith(lastNavURL) && !normalizeDomain(url).includes(normalizeDomain(lastNavURL)))) {
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
                const redirectURL = browser.runtime.getURL('../pages/querying.html');
                browser.tabs.update(tabId, { url: redirectURL });
                queryGoogleWebRiskAPI(url, webURL, tabInfo, lastNavURL)
                queryURLScanIOSubmit(url, webURL, tabInfo, lastNavURL);
            }
        }
    });
});

/*
 * Store Blocking Details
 */

function storeBlockDetails(tabId, blockedURL, blockCategories) {
    const blockDetails = {
        blockedURL,
        blockCategories,
        timestamp: new Date().toISOString(),
    };

    browser.storage.local.get({blockHistory: [] }, function(result) {
        const blockHistory = result.blockHistory || [];
        blockHistory.push(blockDetails);
        browser.storage.local.set({ blockHistory});
    });
    //console.log("Stored Block with details: "+blockDetails);
}


/*
 * Payment Info Detection Behaviour
*/

let tab;
let newTab;

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    //console.log("Message Received: "+message);


    if (message.type === "payment-detected") {
        browser.tabs.query( { active: true, currentWindow: true }, function (tabs) {
              tab = tabs[0];
        });
        browser.tabs.create({ url: browser.runtime.getURL("pages/paymentInfoPopup.html") }, function (createdTab) {
            newTab = createdTab;
        });
    }
    else if (message.type === "close-popup") {
        console.log("Closed popup tab with ID: " + newTab.id);
        browser.tabs.remove(newTab.id);
        newTab = null;
    }
    else if (message.type === "close-both-tabs") {
        console.log("Closed popup tab with ID: " + newTab.id);
        browser.tabs.remove(newTab.id);
        newTab = null;
        console.log("Closed popup tab with ID: " + tab.id);
        browser.tabs.remove(tab.id);
        tab = null;
    }
})

/*
 * Background Ad Blocking Functionality.
 */

let adBlockList = [];
const adBlockListURL = 'https://blocklistproject.github.io/Lists/ads.txt';
const updateIntervalHours = 24;

function updateAdBlockList() {
    console.log('Update Time! Fetching Ad Block List...');
    fetch(adBlockListURL)
        .then(response => response.text())
        .then(text => {
            // Parse the ad block list to extract ad domains
            const domains = text.split('\n')
                .map(line => line.trim().split(' ')[1]) // Extract domain from each line
                .filter(domain => domain !== ''); // Filter out empty lines

            // Store the ad block list in extension storage
            browser.storage.local.set({ 'adBlockList': domains }, function() {
                console.log('Ad block list updated:', domains);
            });
        })
        .catch(error => console.error('Error fetching ad block list:', error));
}

// Set interval to update ad block list
setInterval(updateAdBlockList, updateIntervalHours * 60 * 60 * 1000);

// Initial Install - Sets 'Ad Blocking' to enabled; updates Ad Block List.
browser.runtime.onInstalled.addListener(function() {
    browser.storage.local.set({ 'adBlockingEnabled': true }, function() {
        console.log('adBlockingEnabled set to true upon installation.');
    });

    updateAdBlockList();
});

/* Banking Website */
function bankingWebsiteDetected(domainName) {
    browser.tabs.query( { active: true, currentWindow: true }, function (tabs) {
        tab = tabs[0];
    });

    browser.tabs.create({ url: browser.runtime.getURL("../pages/bankingWebsiteDetected.html?domainName="+domainName) }, function (createdTab) {
        newTab = createdTab;
    });

}

function normalizeDomain(url) {
    // Remove '.com' and '.co.uk' and normalize to lowercase
    if (typeof url !== 'string' || url.trim() === '') {
        return null; // If the input is not a string or is empty, return null
    }
    const hostnameMatch = url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/im);
    if (hostnameMatch && hostnameMatch[1]) {
        return hostnameMatch[1].replace(/\.com$|\.co\.uk$/, '').toLowerCase();
    }
    return null; // If the domain part cannot be extracted, return null
}

export {
    bankingWebsiteDetected
}; 