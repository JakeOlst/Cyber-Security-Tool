document.addEventListener('DOMContentLoaded', function() {
    const adBlockToggle = document.getElementById('adBlockToggle');

    chrome.storage.local.get('adBlockingEnabled', function(data) {
        if (typeof data.adBlockingEnabled === 'undefined') {
            chrome.storage.local.set({ 'adBlockingEnabled': true });
            adBlockToggle.checked = true;
        } else {
            adBlockToggle.checked = data.adBlockingEnabled;
        }

        updateAdBlockingStatus(adBlockToggle.checked);
    });

    adBlockToggle.addEventListener('change', function() {
        const isEnabled = adBlockToggle.checked;
        chrome.storage.local.set({ 'adBlockingEnabled': isEnabled });
        chrome.runtime.sendMessage({ type: 'updateAdBlockingStatus', isEnabled });
    });

    function updateAdBlockingStatus(isEnabled) {
        chrome.runtime.sendMessage({ type: 'updateAdBlockingStatus', isEnabled });
    }
});