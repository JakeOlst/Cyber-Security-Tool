
/* 
 * Payment Info Detection 
*/

// Regex for UK Credit Card providers (Visa, MasterCard, American Express, Maestro)
// Source: https://ihateregex.io/expr/credit-card/
const ukCreditCardRegex = /^(?:4[0-9]{3}\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}|4[0-9]{15}|5[1-5][0-9]{2}\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}|5[1-5][0-9]{14}|3[47][0-9]{2}\s*[0-9]{6}\s*[0-9]{5}|3[47][0-9]{13}|(?:6011|65[0-9]{2}|64[4-9]|62212[6-9]|6221[3-9][0-9]|622[2-8][0-9]{2}|6229[01])\s*-[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}|(?:6011|65[0-9]{2}|64[4-9]|62212[6-9]|6221[3-9][0-9]|622[2-8][0-9]{2}|6229[01])[0-9]{12}|(?:5018|5020|5038|6304|6759|6761|6763)\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{1,8}|(?:5018|5020|5038|6304|6759|6761|6763)[0-9]{12,15}|(?:50[0-9]{2}|65[0-9]{2})\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{4}\s*[0-9]{1,8}|(?:50[0-9]{2}|65[0-9]{2})[0-9]{12,15})$/;

let shouldBlockProceed = false;

function checkNumberAgainstRegex(input) {
  if (ukCreditCardRegex.test(input)) {
    console.log("Credit card detected. Sending message.");
    browser.runtime.sendMessage({
      type: "payment-detected"
    });
  }
}

function handleInput(event) {
  const input = event.target;
  console.log(input);
  if ((event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") && input) {
      checkNumberAgainstRegex(input);
      console.log(input);
  }
}

document.addEventListener("input", handleInput);