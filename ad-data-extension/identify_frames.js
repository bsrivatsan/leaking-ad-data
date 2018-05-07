/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Identifies if current frame is an ad. If so, asks for internal
 *  frame processing by bg_script and process_frame. Then, _____
 * Dependencies: main.js, process_ads.js, util/*, jquery.js, user.js 
 * ----------------------------------------------------------------------------------
 */

var frameURLs = new Object();
var frameContent = new Object();
var idx = -1;
var currAd = false;
var topAd = false;
var type = "none"

/* ----------------------------------------------------------------------------------
 * Helper Methods
 * ----------------------------------------------------------------------------------
 */

// Returns the index of the iframe in the parent document,
//  or -1 if we are the topmost document
// From https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo
function iframeIndex(win) {
    win = win || window; // Assume self by default
    if (win.parent != win) {
        for (var i = 0; i < win.parent.frames.length; i++) {
            if (win.parent.frames[i] == win) { return i; }
        }
        throw Error("In a frame, but could not find myself");
    } else {
        return -1;
    }
}

// Returns a unique index in iframe hierarchy, or empty string if topmost
// From https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo
function iframeFullIndex(win) {
    win = win || window; // Assume self by default
    if (iframeIndex(win) < 0) {
        return "";
    } else {
        var index = iframeFullIndex(win.parent) + "." + iframeIndex(win);
        return index;
    }
}

// return whether this is in an iFrame
// http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/* ----------------------------------------------------------------------------------
 * Check frame for ad
 * ----------------------------------------------------------------------------------
 */

// from https://stackoverflow.com/questions/5582574/how-to-check-if-a-string-contains-text-from-an-array-of-substrings-in-javascript
function containsAny(str, substrings) {
    if(str == null) return false;

    for (var i = 0; i < substrings.length; i++) {
       var substring = substrings[i];
       if (str.indexOf(substring) != - 1) {
         return true;
       }
    }
    return false; 
}

// Checks whether url matches regex from personally-constructed ad id list
function checkAddr(addr) {
    // TODO: check frame id for facebook, general ads
    if ((addr != undefined && containsAny(addr, googleFrames))) 
        return "GOOG";
    if ((addr != undefined && containsAny(addr, amazonFrames))) 
        return "AMAZON";
    if ((addr != undefined && containsAny(addr, facebookFrames))) 
        return "FBAD";
    if ((addr != undefined && containsAny(addr, thirdPartyFrames))) 
        return "3PTY";
    return "none"
}

/* ----------------------------------------------------------------------------------
 * Ask for nested frames
 * ----------------------------------------------------------------------------------
 */

// Function to retrieve data nested in internal frames
function getNested(index, callback) {
    var nestedFrameContent = {};    
    var nestedFrameURLs = {};
    var checked = 0;

    for (var i = 0; i < window.frames.length; i++) {
        var toCheck = index + "." + i;
        chrome.runtime.sendMessage({msg:'get_frame', type: type, frameIdx: toCheck}, function(response) {
            if (response != null) {
                nestedFrameContent[toCheck] = response.frameContent;
                nestedFrameURLs[toCheck] = response.frameURLs;
                ++checked;
                if (checked >= window.frames.length) {
                    callback(nestedFrameContent, nestedFrameURLs);
                }
            }
            return true;
        });
    }
}

/* ----------------------------------------------------------------------------------
 * Process this frame
 * ----------------------------------------------------------------------------------
 */

function processFrame(nestedFrameContent, nestedFrameURLs, callback) {
    frameURLs.frameURL = window.location.href;
    var urls = [];
    $("a").each(function() {
        if(this.href != null && this.href != "")
            urls.push(this.href)
    })
    var scripts = [];
    $("script").each(function() {
        if(this.src != null && this.src != "") {
            scripts.push(this.src);            
        } else if(this.href != null && this.href != "") {
            scripts.push(this.href);                        
        }
    })
    frameURLs.adURLs = convertListToDict(urls);
    frameURLs.scriptURLs = convertListToDict(scripts);
    if (document.body.clientWidth > 1 || document.body.clientHeight > 1) {
        frameContent.cls = "FULL_SIZE";
    } else {
        frameContent.cls = "PIX";        
    }
    frameURLs.name = window.name;
    frameURLs.id = idx;    
    frameURLs.nestedFrameURLs = nestedFrameURLs;    

    html = document.documentElement.innerHTML;
    text = document.body.innerText;    
    frameContent.html = JSON.stringify(html.slice(1, -1));
    frameContent.text = JSON.stringify(text.slice(1, -1));    
    frameContent.type = type;
    frameContent.nestedFrameContent = nestedFrameContent;

    callback(removeEmpty(frameContent), removeEmpty(frameURLs));
}

/* ----------------------------------------------------------------------------------
 * Send an ad
 * ----------------------------------------------------------------------------------
 */

// Function that sends ad containers back to main script
function sendAd(frameContent, frameURLs) {  
    convertFrameToAd(frameContent, frameURLs, function(adURLObject, adContentObject, adMetadataObject) {
        finalizeAd(adURLObject, adContentObject, adMetadataObject);
    });
}

/* ----------------------------------------------------------------------------------
 * Check current frame
 * ----------------------------------------------------------------------------------
 */

if (idx === -1) {
    idx = iframeFullIndex(window);
}

// Listens for extraction request from background script
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.msg === 'extract_frame') {
        if ((request.frameIdx === idx)) {
            window.topAd = true; 
            type = request.type;
            getNested(idx, function(nestedFrameContent, nestedFrameURLs) {
                processFrame(nestedFrameContent, nestedFrameURLs, function(frameContent, frameURLs) {
                    sendResponse({nestedFrameContent: frameContent, nestedFrameURLs: frameURLs, extractedIdx: idx});
                    return true;
                });
            });
        }
    }
    return true;
});

if(!topAd && !currAd) {
    var srcType = checkAddr(window.location.href);
    var nameType = checkAddr(window.name);
    if (srcType !== "none") {
        currAd = true;
        type = srcType;
    } else if (nameType !== "none") {
        currAd = true;
        type = nameType;
    }

    if (currAd) {
        //console.log('found ad at ' + idx)   
        var nestedFrameContent = {}
        var nestedFrameURLs = {} 
        getNested(idx, function(nestedFrameContent, nestedFrameURLs) {
            processFrame(nestedFrameContent, nestedFrameURLs, function(frameContent, frameURLs) {
                sendAd(frameContent, frameURLs);
            });
        });
    } else {
        //console.log('hit ' + idx)
    }
}