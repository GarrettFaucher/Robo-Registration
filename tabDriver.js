/*
  tabDriver.js

  Drives the whole login/registration process by running automations
  at specific times, or when specific events occur.
*/

// globals
var preLoggedOn = false; // Indicates whether the user is already logged in to UVM

//Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Sends a response to background.js in reference to an automation
//This function is used to send the return value of an automation
function respondToBackground(automationName, returnVal){
  console.log('Automation '+automationName+' is responding to background.js with returnVal: '+returnVal);
  chrome.runtime.sendMessage({automation: automationName, success: returnVal}, function(response) {});
}

//Sends driverReady to background.js, so that it knows when to execute the next command
function broadcastReady(){
  console.log('Broadcasting driverReady to background.js');
  chrome.runtime.sendMessage({driverReady: true});
}

/*
AUTOMATIONS

Each automation runs a stage of the process and returns true if it succeeded, or false if it failed.
Return values are handled by start()

*/
async function login() {
     console.log("running login automation");

     if (!loggedOn()) {
          var usernameInput = document.getElementsByName("username")[0];
          var passwordInput = document.getElementsByName("password")[0];
          var submitButton = document.getElementsByName("submit")[0];

          chrome.storage.local.get(['username'], function(result) {
               usernameInput.value = result.username;
          });

          chrome.storage.local.get(['password'], function(result) {
               passwordInput.value = result.password;
          });

          console.log('Waiting for page to load...');
          await sleep(2000);
          console.log('Page should have loaded.');

          submitButton.click();
     } else {
          preLoggedOn = true;
     }

     return true;
}


// loggedOn returns a boolean value based on if the user has navigated past
// the webauth.uvm.edu/webauth/login page.
// Returns true if user has logged on
function loggedOn() {
     console.log("running loggedOn automation");
     // Element only on login page
     var element = document.getElementById("login-topcontainer");
     // If element is still on page user hasn't logged in
     if (typeof(element) != 'undefined' && element != null){
          console.log('User is not logged on');
          return false;
     } else {
          console.log('User is logged on');
          return true;
     }
}

// navigateToRegistrar is called once the user has been logged on
async function navigateToRegistrar() {
     console.log("running navigateToRegistrar automation");
     var regButton = document.querySelectorAll('[href="https://myuvm.uvm.edu/web/home-community/registrar"]')[0];
     regButton.click();
     return true;
}

// navigateToButton is called once the user has navigated to registrar page
async function navigateToAddDrop() {
     console.log("running navigateToAddDrop automation");
     var addDropButton = document.querySelectorAll('[alt="add drop withdraw"]')[0];
     addDropButton.click();
     return true;
}

// handleCommand handles incoming messages from background.js to
// run automations and send back the responses via respondToBackground
async function handleCommand(request){
  console.log('running automation: '+request.command);
  switch (request.command){
    case 'login':
      var returnVal = await login();
      respondToBackground(request.command, returnVal);
      if (preLoggedOn) {
          broadcastReady();
      }
      break;
    case 'checkLogin':
      var returnVal = await loggedOn();
      respondToBackground(request.command, returnVal);
      broadcastReady();
      break;
    case 'navigateToRegistrar':
      var returnVal = await navigateToRegistrar();
      respondToBackground(request.command, returnVal);
      break;
    case 'navigateToAddDrop':
     var returnVal = await navigateToAddDrop();
     respondToBackground(request.command, returnVal);
     break;
    default:
      break;

  }
}


// Main function runs when the program is run
// This function is what is injected into every *.uvm.edu page.
// The function waits for specific commands from the background page,
// and does things on the UVM page based on those commands
function main(){
  //logs in this file can be seen on the UVM page's console - doesn't log to normal background page
  console.log("TABDRIVER: driver is ready");
  broadcastReady();

  // Create a message listener to listen for messages from background.js
  chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    sendResponse();
    handleCommand(request);
  });

}
main();
