document.addEventListener('DOMContentLoaded', function() {
    const adBlockToggle = document.getElementById('adBlockToggle');

    browser.storage.local.get('adBlockingEnabled', function(data) {
        if (typeof data.adBlockingEnabled === 'undefined') {
            browser.storage.local.set({ 'adBlockingEnabled': true });
            adBlockToggle.checked = true;
        } else {
            adBlockToggle.checked = data.adBlockingEnabled;
        }

        updateAdBlockingStatus(adBlockToggle.checked);
    });

    adBlockToggle.addEventListener('change', function() {
        const isEnabled = adBlockToggle.checked;
        browser.storage.local.set({ 'adBlockingEnabled': isEnabled });
        browser.runtime.sendMessage({ type: 'updateAdBlockingStatus', isEnabled });
    });

    function updateAdBlockingStatus(isEnabled) {
        browser.runtime.sendMessage({ type: 'updateAdBlockingStatus', isEnabled });
    }
});