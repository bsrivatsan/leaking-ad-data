/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Miscellaneous user-related functions performed for different content
 *  scripts, including dealing with userids, encryption, and locally stored 
 *  personal information
 * Dependencies: jquery.js
 * ----------------------------------------------------------------------------------
 */

// Time until lottery eligibility
var HOLD_TIME = 1210000000

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

// Generates or retrieves a random user ID
// Modified from: https://stackoverflow.com/questions/23822170/getting-unique-clientid-from-chrome-extension
function getUserId(callback) {
    chrome.storage.sync.get(null, function(items) {
        var uid = ''
        if (items.userid != undefined) {
            uid = items.userid;     
        } else {
            uid = getRandomToken();
            chrome.storage.sync.set({'userid': uid}, function() {});

            // If this is the first time the extension is used, set the two week use alarm
            setTwoWeekAlarm();
        }
        callback(uid)
    });
}

// Retrieves user info (for local pruning use, never sent to server)
function retrieveInfo(callback) {
    chrome.storage.local.get(null, function(items) {
        var info = {};
        info.fname = items.fname;
        info.lname = items.lname;
        info.bday = items.bday;
        info.ccity = items.ccity;
        info.cstate = items.cstate;
        info.ccountry = items.ccountry;
        info.hcity = items.hcity;
        info.hstate = items.hstate;
        info.hcountry = items.hcountry;
        callback(info)
    });
}

// Cryptographic hash function for personal information stored in server
// Modified from http://ramkulkarni.com/blog/encrypting-data-with-crypto-js-in-javascript/
function encrypt(privateData, callback) {    
    chrome.storage.local.get(null, function(items) {        
        var key = ''
        if (items.cipherkey != undefined) {
            key = items.cipherkey;     
        } else {
            key = getRandomToken();
            chrome.storage.local.set({'cipherkey': key}, function() {});
        }
        var str = JSON.stringify(privateData)
        var enc = CryptoJS.AES.encrypt(str, key);
        callback(enc.toString())
    });
}

function decrypt(encryptedData, callback) {    
    chrome.storage.local.get(null, function(items) {        
        var key = ''
        if (items.cipherkey != undefined) {
            key = items.cipherkey;     
        } else {
            console.error("No cipherkey present in local storage!")
            return null
        }

        var dec = CryptoJS.AES.decrypt(encryptedData, key);
        var str = dec.toString(CryptoJS.enc.Utf8);
        var privateData = JSON.parse(str)
        callback(privateData)
    });
}

// Sets an alarm to be triggered in two weeks that will prompt users for their email (used in giving out gift cards)
function setTwoWeekAlarm() {
    var currTime = Date.now()
    chrome.storage.sync.set({'startTime': currTime}, function() {});    
    var almInfo = new Object();
    almInfo.when = currTime + HOLD_TIME
    chrome.alarms.create("emailAlarm", almInfo)
}

// converts a list to a dict
function convertListToDict(list) {
    var dict = {};
    for (var i = 0; i < list.length; i++) {
        dict[i] = list[i];
    }
    return dict;
}

// converts "" to null
function removeEmpty(dict) {
    Object.keys(dict).forEach(function(key) {
        if(dict[key] === "") {
            dict[key] = null;
        }
    });
    return dict;
}

// converts t/f/null to strings
function makeStrings(dict) {
    Object.keys(dict).forEach(function(key) {
        if(dict[key] == null || dict[key] == true || dict[key] == false) {
            dict[key] = "\""+dict[key]+"\""
        }
    });
    return dict;
}