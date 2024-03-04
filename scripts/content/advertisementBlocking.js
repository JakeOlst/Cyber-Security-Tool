/*
 * Ad Blocking Functionality using Ad Block List.
 */

let adBlockList = [];

function blockAdsOnPage() {
    const adElements = document.querySelectorAll('iframe, body, head, script, img, object, embed, video, audio, source, track, canvas, svg, a, math, link, section');

    adElements.forEach(element => {
        const src = element.src || element.getAttribute('src');
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

chrome.storage.local.get(['adBlockList', 'adBlockingEnabled'], (result) => {
    adBlockList = result.adBlockList || [];
    const adBlockingEnabled = result.adBlockingEnabled || false;

    if (adBlockingEnabled) {
        blockAdsOnPage();
    }
});