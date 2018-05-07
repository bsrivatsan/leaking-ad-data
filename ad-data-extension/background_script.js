/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Performs background functions; listens for and sends messages, and 
 * triggers an alarm at two weeks of use
 * Dependencies: XMLHttpRequest
 * Acknowledgements: Perceptual AdBlocker
 * ----------------------------------------------------------------------------------
 */

var AD_DATA_URL = "https://p0bvpyazk4.execute-api.us-east-2.amazonaws.com/prod/DynamoDBManager"
var USER_DATA_URL = "https://fqxvjurvui.execute-api.us-east-2.amazonaws.com/prod/UserInfoManager"
var EMAIL_LOTTERY_URL = "https://ar72gi5uai.execute-api.us-east-2.amazonaws.com/prod/LotteryManager"

var URL_TYPE = "URL";
var CONTENT_TYPE = "CONTENT";
var METADATA_TYPE = "METADATA";
var IMAGE_TYPE = "IMAGE";
var LOTTERY_TYPE = "LOTTERY";
var USER_TYPE = "USER";

function sendToAWS(data, url) {
    function reqListener () {
        //console.log(this.responseText);
    }
    //console.log(data)
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", reqListener);    
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");        
    xhr.send(data)
    return true;
}

// converts a list to a dict
function convertListToDict(list) {
    var dict = {};
    for (var i = 0; i < list.length; i++) {
        dict[i] = list[i];
    }
    return dict;
}

// Listens for response from ad identifying content scripts and send it to database
// Also listens for requests to take screenshots and sends to database
// this part partly from https://stackoverflow.com/questions/18794407/chrome-extension-api-chrome-tabs-capturevisibletab-on-background-page-to-conten
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.msg === 'send_to_AWS') {
        if (request.type === 'AD'){
            var ad_urls = request.url_data;
            var ad_content = request.content_data;
            var ad_metadata = request.metadata_data;
            ad_urls.source = sender.url;

            ad_content.text = JSON.stringify(ad_content.text.slice(1, -1));
            ad_content.html = JSON.stringify(ad_content.html.slice(1, -1));
            
            var urls_data = JSON.stringify(ad_urls);
            var content_data = JSON.stringify(ad_content);
            var metadata_data = JSON.stringify(ad_metadata);            

            var info_urls = "{ \"type\":" + URL_TYPE + ", \"objid\":" + request.objid + ", \"uid\":" + request.uid + ", \"time\":" + request.time + ", \"data\":" + urls_data +"}"            
            var info_content = "{ \"type\":" + CONTENT_TYPE + ", \"objid\":" + request.objid + ", \"uid\":" + request.uid + ", \"time\":" + request.time + ", \"data\":" + content_data +"}"
            var info_metadata = "{ \"type\":" + METADATA_TYPE + ", \"objid\":" + request.objid + ", \"uid\":" + request.uid + ", \"time\":" + request.time + ", \"data\":" + metadata_data +"}"
            
            
            sendToAWS(info_urls, AD_DATA_URL);
            sendToAWS(info_content, AD_DATA_URL);
            sendToAWS(info_metadata, AD_DATA_URL);      
        } else if (request.type === "USER") {
            var data = request.data;
            var info = "{ \"userid\":\"" + data.uid + "\", \"type\":\"" + USER_TYPE + "\", \"data\":" + data.data + ", \"privateData\":\"" + data.privateData +"\"}"
            sendToAWS(info, USER_DATA_URL);
        } else if (request.type === 'LOTTERY') {
            var data = request.data;
            var submission = "{ \"email\":" + JSON.stringify(data.email) + ", \"type\":" + LOTTERY_TYPE + ", \"startTime\":\"" + data.startTime + "\", \"time\":\"" + data.time + "\"}"
            sendToAWS(submission, EMAIL_LOTTERY_URL);
        }
        return true;
    } else if (request.msg === "send_shot") {
        chrome.tabs.captureVisibleTab(null, {format:"png"}, function(url) {
                var str_img = JSON.stringify(url);
                var info = "{ \"type\":\"" + IMAGE_TYPE + "\", \"objid\":\"" + request.objid + "\", \"uid\":\"" + request.uid + "\", \"time\":\"" + request.time + "\", \"data\":" + str_img +"}"
                sendToAWS(info, AD_DATA_URL);
            }
        );
        return true;
    } else if (request.msg === "get_frame") {
        var sent = false;
        window.setTimeout(function() {
            if(!sent) {
                sendResponse({frame: null});
            }
        }, 2000);
        chrome.tabs.sendMessage(sender.tab.id, {msg:"extract_frame", type: request.type, frameIdx: request.frameIdx}, function(response) {
            if (response != null) {
                sent = true;
                sendResponse({frameContent: response.nestedFrameContent, frameURLs: response.nestedFrameURLs});                
            } 
            return true;
        });
    }
    return true;
});

// Allows users to enter a lottery for gift cards after two weeks of use
chrome.alarms.onAlarm.addListener(function( emailAlarm ) {
    alert('Thank you for spending two weeks with my extension! You can now enter into a raffle for one of five $40 Amazon/Airbnb gift cards. If you navigate back to the extension (click the icon), you\'ll be able to enter your email and participate. \n -Bharath');
    chrome.storage.sync.set({'longEnough': "true"}, function() {});
});