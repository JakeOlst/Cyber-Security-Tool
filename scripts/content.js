
/* 
 * Payment Info Detection 
*/

// Regex for UK Credit Card providers (Visa, MasterCard, American Express)
// Source: https://ihateregex.io/expr/credit-card/
const ukCreditCardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|(?:6011|65[0-9]{2}|64[4-9]|62212[6-9]|6221[3-9][0-9]|622[2-8][0-9]{2}|6229[01])-[0-9]{10}|(?:5[0678]\d\d|6304|6390|67\d\d)\d{8,15}|(?:5018|5020|5038|6304|6759|6761|6763)[0-9]{8,15}|(?:50[0-9]{4}|65[0-9]{2})\d{8,12})$/;
let shouldBlockProceed = false;

function checkNumberAgainstRegex(input) {
  console.log(input);
  if (ukCreditCardRegex.test(input)) {
    console.log("Credit card detected. Sending message.");
    chrome.runtime.sendMessage({
      type: "payment-detected"
    });
  }
  console.log("Not.");
}

document.addEventListener("input", function(event) {
  const input = event.target;
  if ((input.tagName === "INPUT" || input.tagName === "TEXTAREA") && input.value) {
    console.log("Input detected. Tag name: " + input.tagName);
    checkNumberAgainstRegex(input.value);
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "show-popup") {
    showPopup();
  }
});

function showPopup() {
    // Open a new tab with paymentInfoPopup.html
    chrome.runtime.sendMessage({ type: "open-new-tab" });
}
