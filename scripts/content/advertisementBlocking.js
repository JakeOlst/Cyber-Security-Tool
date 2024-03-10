/*
 * Ad Blocking Functionality using Ad Block List.
 */

// Function to block ads based on the adBlockList
function blockAdsOnPage(adBlockList) {
    const adElements = document.querySelectorAll('*');

    adElements.forEach(element => {
        const src = element.src || element.href;
        console.log("Test src: "+src);
        if (src && adBlockList.some(domain => {
            const srcURL = new URL(src);
            const domainParts = domain.split('.');
            const srcDomainParts = srcURL.hostname.split('.');
            return srcDomainParts.length >= domainParts.length &&
                   srcDomainParts.slice(-domainParts.length).join('.') === domain;
        })) {
            console.log("Ad Removed: " + src);
            element.remove();
        }
    });
}

// Fetch adBlockList from local storage
chrome.storage.local.get(['adBlockList', 'adBlockingEnabled'], (result) => {
    const adBlockList = result.adBlockList || [];
    const adBlockingEnabled = result.adBlockingEnabled || false;

    // If ad blocking is enabled, block ads on the page
    if (adBlockingEnabled) {
        blockAdsOnPage(adBlockList);
    }
});