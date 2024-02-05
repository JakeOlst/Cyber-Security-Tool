document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("proceed").addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.runtime.sendMessage({ type: "close-popup", tabId: tabs[0].id });
            //console.log("Message sent from paymentInfoPopup.js");
        });
    });
    document.getElementById("cancel").addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.runtime.sendMessage({ type: "close-both-tabs", tabId: tabs[0].id });
            //console.log("Message sent from paymentInfoPopup.js");
        });
    });
});