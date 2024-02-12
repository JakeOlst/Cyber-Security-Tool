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

export {
    storeBlockDetails
};