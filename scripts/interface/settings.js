document.addEventListener('DOMContentLoaded', function() {
    const adBlockToggle = document.getElementById('adBlockToggle');

    chrome.storage.local.get('adBlockingEnabled', function(data) {
        adBlockToggle.checked = data.adBlockingEnabled || false;
    });

    adBlockToggle.addEventListener('change', function() {
        const isEnabled = adBlockToggle.checked;
        chrome.storage.local.set({ 'adBlockingEnabled': isEnabled });
        chrome.runtime.sendMessage({ type: 'updateAdBlockingStatus', isEnabled });
    });
});