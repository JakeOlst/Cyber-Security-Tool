/*
 * Ad Blocking Functionality using Ad Block List.
*/

let adBlockList = [];

function blockAdsOnPage() {
    console.log("Stage A");
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
        const src = element.src || element.getAttribute('src');
        if (src !== null) {
            console.log(src);
        }
        if (src && adBlockList.some(domain => src.includes(domain))) {
            console.log(" removed.");
            element.remove();
        }
    });
}

browser.storage.local.get(['adBlockList', 'adBlockingEnabled'], (result) => {
    adBlockList = result.adBlockList || [];
    const adBlockingEnabled = result.adBlockingEnabled || false;

    if (adBlockingEnabled) {
        blockAdsOnPage();
    }
});