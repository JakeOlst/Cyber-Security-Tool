document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("proceed").addEventListener("click", function () {
        // Get the currently active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // Send a message to close only the active tab
            chrome.runtime.sendMessage({ type: "close-popup", tabId: tabs[0].id });
            console.log("Message sent from paymentInfoPopup.js");
        });
    });

    document.getElementById("cancel").addEventListener("click", function () {
        // Get the currently active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // Send a message to close only the active tab
            chrome.runtime.sendMessage({ type: "close-both-tabs", tabId: tabs[0].id });
            console.log("Message sent from paymentInfoPopup.js");
        });
    });
});