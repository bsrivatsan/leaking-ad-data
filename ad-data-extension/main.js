/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Converts frames to ads and sends them for processing. Main file for
 *  regular ads to be processed
 * Dependencies: process_ads.js, jquery.js, user.js
 * ----------------------------------------------------------------------------------
 */

/* ----------------------------------------------------------------------------------
 * Helper Methods and Instance Variables
 * ----------------------------------------------------------------------------------
 */

// Main function that sends ad containers back to background script
function finalizeAd(adURLObject, adContentObject, adMetadataObject) {
    checkPII(adURLObject, adContentObject, adMetadataObject, function(adURLs, adContent, adMetadataObj) {
        setMetadata(adMetadataObj, function(adMetadata) {
            chrome.runtime.sendMessage({msg:'send_to_AWS', type: 'AD', objid: adMetadata.objid, uid: adMetadata.uid, time: adMetadata.time, url_data: adURLs, content_data: adContent, metadata_data: adMetadata});
            //chrome.runtime.sendMessage({msg: "send_shot", objid: adMetadata.objid, uid: adMetadata.uid, time: adMetadata.time});
            return true;
        });
    });
}

/* ----------------------------------------------------------------------------------
 * General Code: Resolves advertisement frames into key components
 * ----------------------------------------------------------------------------------
 */

 function convertFrameToAd(frameContent, frameURLs, callback) {
    var adURLObject = new Object();
    var adContentObject = new Object();
    var adMetadataObject = new Object();    
    
    /* ***************
     * Basic Ad Data
     * ***************/
    adURLObject.type = frameContent.type;
    adURLObject.class = frameContent.cls;
    adContentObject.type = frameContent.type;
    adContentObject.class = frameContent.cls;
    adMetadataObject.type = frameContent.type;
    adMetadataObject.class = frameContent.cls;

    /* ***************
     * URL Information
     * ***************/
    adURLObject.adName = frameURLs.name; 
    adURLObject.adURLs = frameURLs.adURLs;
    adURLObject.scriptURLs = frameURLs.scriptURLs;
    adURLObject.frameURL = frameURLs.frameURL;    
    adURLObject.parentDomain = window.location.hostname;
    adURLObject.nestedFrameURLs = frameURLs.nestedFrameURLs;        

    // optional
    adURLObject.adId = frameURLs.id;    
    adURLObject.adSrc = frameURLs.src;
    adURLObject.source = null;

    /* ***************
     * Ad Content
     * ***************/
    adContentObject.text = frameContent.text;
    adContentObject.html = frameContent.html;
    adContentObject.nestedFrameContent = frameContent.nestedFrameContent;    

    /* ***************
     * Flags
     * ***************/
    var flags = new Object();
    adMetadataObject.flags = flags;
    var mainURL = window.location.href;    
    if (mainURL.match('http:')) {
        adMetadataObject.flags.parent_http = true;
    } else {
        adMetadataObject.flags.parent_http = false;
    }

    // to be set in checkPII method
    adMetadataObject.flags.PII = {};
    adMetadataObject.flags.urlPII = {};

    /* ***************
     * User Metadata
     * ***************/
    // to be set in set metadata method
    adMetadataObject.objid = "";
    adMetadataObject.uid = "";
    adMetadataObject.time = "";

    callback(adURLObject, adContentObject, adMetadataObject);
}

/* ----------------------------------------------------------------------------------
 * Facebook Code: Resolves advertisement containers into key components
 * ----------------------------------------------------------------------------------
 */

function convertContainerToAd(containerObject, callback) {
    var adURLObject = new Object();
    var adContentObject = new Object();
    var adMetadataObject = new Object();    

    /* ***************
     * Ad Metadata
     * ***************/
    adURLObject.type = "FB";
    adURLObject.class = containerObject.cls;
    adContentObject.type = "FB";
    adContentObject.class = containerObject.cls;
    adMetadataObject.type = "FB";
    adMetadataObject.class = containerObject.cls;

    /* ***************
     * URL Information
     * ***************/
    adURLObject.urls = containerObject.urls;
    adURLObject.linkText = containerObject.linkText;
    adURLObject.parentDomain = window.location.hostname;
    adURLObject.topDomain = window.top.hostname;    

    /* ***************
     * Ad Content
     * ***************/
    adContentObject.sponsoredText = containerObject.sponsoredText
    adContentObject.text = containerObject.text;
    adContentObject.html = containerObject.html;

    /* ***************
     * Flags
     * ***************/
    var flags = new Object();
    adMetadataObject.flags = flags;
    var mainURL = window.location.href; 
    if (mainURL.match('http:')) {
        adMetadataObject.flags.parent_http = true;
    } else {
        adMetadataObject.flags.parent_http = false;
    }
    // to be set in checkPII method
    adMetadataObject.flags.PII = {};
    adMetadataObject.flags.urlPII = {};

    /* ***************
     * User Metadata
     * ***************/
    // to be set in set metadata method
    adMetadataObject.objid = "";
    adMetadataObject.uid = "";
    adMetadataObject.time = "";

    callback(adURLObject, adContentObject, adMetadataObject);
}