import { queryGoogleWebRiskAPI } from "./modules/googleWebRiskModule.js";
import { queryURLScanIOSubmit } from "./modules/urlScanIOSubmitModule.js";

const tabInfo = {};
const exclusionList = ["vimeo.com","youtube.com","google.com","msn.com","bing.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //
let lastNavURL = null;

chrome.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    chrome.storage.local.get('lastNavURL', function(getLastURL) {
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
                const redirectURL = chrome.runtime.getURL('../pages/querying.html');
                chrome.tabs.update(tabId, { url: redirectURL });
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

    chrome.storage.local.get({blockHistory: [] }, function(result) {
        const blockHistory = result.blockHistory || [];
        blockHistory.push(blockDetails);
        chrome.storage.local.set({ blockHistory});
    });
    //console.log("Stored Block with details: "+blockDetails);
}


/*
 * Payment Info Detection Behaviour
*/

let tab;
let newTab;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    //console.log("Message Received: "+message);


    if (message.type === "payment-detected") {
        chrome.tabs.query( { active: true, currentWindow: true }, function (tabs) {
              tab = tabs[0];
        });
        chrome.tabs.create({ url: chrome.runtime.getURL("pages/paymentInfoPopup.html") }, function (createdTab) {
            newTab = createdTab;
        });
    }
    else if (message.type === "close-popup") {
        console.log("Closed popup tab with ID: " + newTab.id);
        chrome.tabs.remove(newTab.id);
        newTab = null;
    }
    else if (message.type === "close-both-tabs") {
        console.log("Closed popup tab with ID: " + newTab.id);
        chrome.tabs.remove(newTab.id);
        newTab = null;
        console.log("Closed popup tab with ID: " + tab.id);
        chrome.tabs.remove(tab.id);
        tab = null;
    }
})

/*
 * Background Ad Blocking Functionality.
 */

let easyList = [];
const easyListURL = 'https://easylist.to/easylist/easylist.txt';
const updateIntervalHours = 24;

function updateEasyList() {
    console.log('Update Time! Fetching EasyList...');
    fetch(easyListURL)
        .then(response => response.text())
        .then(easyListText => {
            easyList = easyListText.split('\n')
                .filter(line => line.startsWith('||') || line.startsWith('##'))
                .map(line => line.trim().replace(/^\|\|/, '').replace(/\^$/, ''));
            easyList.push("googleadservices.com/pagead/");
            //console.log('EasyList content:', easyList);
            chrome.storage.local.set({ 'easyList': easyList }, function() {
            });
        })
        .catch(error => console.error('Error fetching EasyList:', error));
}


// Set interval to update EasyList
setInterval(updateEasyList, updateIntervalHours * 60 * 60 * 1000);

// Initial fetch on extension install or chrome startup
chrome.runtime.onInstalled.addListener(updateEasyList);

/* Banking Website */
function bankingWebsiteDetected(domainName) {
    chrome.tabs.query( { active: true, currentWindow: true }, function (tabs) {
        tab = tabs[0];
    });

    chrome.tabs.create({ url: chrome.runtime.getURL("../pages/bankingWebsiteDetected.html?domainName="+domainName) }, function (createdTab) {
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