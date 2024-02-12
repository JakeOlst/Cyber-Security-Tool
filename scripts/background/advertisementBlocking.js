/*
 * Ad Blocking Functionality using EasyList.
*/
let easyList = [];
function blockAdsOnPage() {
    const elements = document.querySelectorAll('div, img, script, iframe, [src]');
    elements.forEach(element => {
        const src = element.src || element.getAttribute('src');
        if (src && easyList.some(domain => src.includes(domain))) {
            element.remove();
        }
    });
}

browser.storage.local.get('easyList', (result) => {
    easyList = result.easyList;
    blockAdsOnPage();
});