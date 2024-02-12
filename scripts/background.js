import { queryGoogleWebRiskAPI } from "./modules/googleWebRiskModule.js";
import { queryURLScanIOSubmit } from "./modules/urlScanIOSubmitModule.js";

const corsProxy = "https://corsproxy.io/?"
const tabInfo = {};
const exclusionList = ["vimeo.com","youtube.com","google.com","msn.com","bing.com"] // Exclusion list, to avoid pop-up media in websites causing additional API Calls //
let lastNavURL = null;

// The 'score' threshold for URLScan.IO API: -100 (legitimate) to 100 (illegitimate). Default is 30 to avoid false positives.
// Lowering for testing.
const urlScanMaxScore = 30;

browser.webNavigation.onBeforeNavigate.addListener(function (webURL) {
    const url = webURL.url;
    const tabId = webURL.tabId;

    browser.storage.local.get('lastNavURL', function(getLastURL) {
        lastNavURL = getLastURL.lastNavURL || null;
        if (lastNavURL != null) {
            console.log('Last Navigated URL:', lastNavURL);
        }
        else {
            console.log('Last Nav URL not found in storage.');
        }
    
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
                const redirectURL = browser.runtime.getURL('../pages/querying.html');
                browser.tabs.update(tabId, { url: redirectURL });
                queryGoogleWebRiskAPI(url, webURL)
                queryURLScanIOSubmit(url, webURL);
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

let easyList = [];
const easyListURL = 'https://easylist.to/easylist/easylist.txt';
const updateIntervalHours = 24;

function updateEasyList() {
    console.log('Update Time! Fetching EasyList...');
    fetch(corsProxy+easyListURL)
        .then(response => response.text())
        .then(easyListText => {
            easyList = easyListText.split('\n')
                .filter(line => line.startsWith('||') || line.startsWith('##'))
                .map(line => line.trim().replace(/^\|\|/, '').replace(/\^$/, ''));
            easyList.push("googleadservices.com/pagead/");
            console.log('EasyList content:', easyList);
            browser.storage.local.set({ 'easyList': easyList }, function() {
            });
        })
        .catch(error => console.error('Error fetching EasyList:', error));
}


// Set interval to update the EasyList
setInterval(updateEasyList, updateIntervalHours * 60 * 60 * 1000);

// Initial fetch on extension install or browser startup
browser.runtime.onInstalled.addListener(updateEasyList);

/* Banking Website */
function bankingWebsiteDetected(domainName) {
    browser.tabs.query( { active: true, currentWindow: true }, function (tabs) {
        tab = tabs[0];
    });

    browser.tabs.create({ url: browser.runtime.getURL("../pages/bankingWebsiteDetected.html?domainName="+domainName) }, function (createdTab) {
        newTab = createdTab;
    });

}