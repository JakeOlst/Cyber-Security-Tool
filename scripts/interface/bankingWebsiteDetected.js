document.addEventListener('DOMContentLoaded', function () {
    let params = new URLSearchParams(window.location.search);
    let bankDomain = params.get('domainName');

    // Fetch the JSON file
    fetch('../../config/bankingWebsites.json')
        .then(response => response.json())
        .then(data => {
            const foundBank = data.bankingWebsites.find(bankEntry => bankEntry.bankDomainName.includes(bankDomain));

            if (foundBank) {
                const bankContactURL = new URL(foundBank.bankContactPage);
                const bankName = foundBank.bankName;
                const bankURL = bankContactURL.toString();
                console.log("Found: Name: " + bankName + "; URL: " + bankURL + "; Domain: " + bankDomain);

                const popupBankName = document.getElementById('popupBankName');
                popupBankName.textContent = bankName;

                const popupBankContact = document.getElementById('popupBankContact');
                popupBankContact.textContent = bankURL;
            } else {
                throw new Error("No Domain Found for Domain " + bankDomain);
            }
        })
        .catch(error => {
            console.error('There was an error fetching the threatTypes.json file. Details:', error);
        });

    document.getElementById("proceed").addEventListener("click", function () {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            browser.runtime.sendMessage({ type: "close-popup", tabId: tabs[0].id });
            //console.log("Message sent from bankingWebsiteDetected.js");
        });
    });

    document.getElementById("cancel").addEventListener("click", function () {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            browser.runtime.sendMessage({ type: "close-both-tabs", tabId: tabs[0].id });
            //console.log("Message sent from bankingWebsiteDetected.js");
        });
    });
});