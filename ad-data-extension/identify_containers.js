/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Finds containers on Facebook pages and identifies if they are ads. 
 *  If so, sends information on to be processed and sent to database
 * Dependencies: process_ads.js, user.js, jquery.js
 * Acknowledgements: Perceptual AdBlocker
 * ----------------------------------------------------------------------------------
 */

 /* ----------------------------------------------------------------------------------
 * Helper Methods and Instance Variables
 * ----------------------------------------------------------------------------------
 */

// default to a list of "Sponsored" text for all known locales
var textPossibilities = TEXT_POSSIBILITIES_DEFAULT;

// has sidebar been checked?
var sidebarChecked = false;

// Marks processed containers
function markContainer(container) {
    container.addClass("LADMarked");
}

// Returns whether the container is already processed
function alreadyProcessed(container) {
    return container.hasClass("LADMarked");
}

function toggleSidebarChecked() {
    sidebarChecked = true;
    setTimeout(function() { sidebarChecked = false}, 1000);
}

   
/* ----------------------------------------------------------------------------------
 * Selects ads from possible list based on "Sponsored" text presence
 * ----------------------------------------------------------------------------------
 */

// Select ads from a list of possible ads, then apply resultFunction. 
// If deepestOnly, only proceess the deepest of a set of containers.
function checkTextAndOrLink(possibleAds, deepestOnly, resultFunction, textMatches) {
    // Contains the locale's sponsored text;
    var matchingText = "";
    // For each possible ad, check whether it is an ad and apply resultFunction
    possibleAds.each( function() {
        var me = $(this);

        // Make sure not to re-process advertisements
        if (alreadyProcessed(me)) {
            return false;
        }

        var childLinks = me.find("a");
        // select only links whose text matches "Sponsored" text
        var sponsoredTextLinks = childLinks.filter( function(index) {
            // Make sure that text added dynamically via the CSS pseudoselectors
            // :before and :after is included in the text checked.
            var before = window.getComputedStyle($(this).get(0),':before').getPropertyValue("content").replace(/\"/g, "");
            var after = window.getComputedStyle($(this).get(0),':after').getPropertyValue("content").replace(/\"/g, "");
            var text = $(this).text();
            var fullText = before + text + after;
            
            // if this link contains one of the sponsored text names, return true
            if (textMatches.indexOf(fullText) !== -1) {
                matchingText = fullText;
                return true;
            } else if (fullText.search(/S[Ss]*p[Ss]*o[Ss]*n[Ss]*s[Ss]*o[Ss]*r[Ss]*e[Ss]*d[Ss]*/) !== -1) {
                matchingText = fullText;
                return true;  
            } else {
                return false;
            }
        });

        if (sponsoredTextLinks.length > 0) {
            var containerObject = new Object();
            containerObject.linkText = childLinks;
            containerObject.sponsoredText = matchingText;
            containerObject.text = me.text();
            containerObject.html = me.html();

            if (deepestOnly) {
                if (sidebarChecked === true) {
                    return true;
                }
                toggleSidebarChecked();
                containerObject.cls = "SIDEBAR";        
            } else {
                containerObject.cls = "NEWSFEED";                
            }
            var urls = []
            childLinks.each( function(index) {
                urls.push($(this).attr('href'));
            });
            containerObject.urls = urls;
            
            resultFunction(containerObject, finalizeAd);
        }
    });
}

/* ----------------------------------------------------------------------------------
 * Finds ads in newsfeed and sidebar
 * ----------------------------------------------------------------------------------
 */

// Find newsfeed ads and apply the result function
// if(firstRun): this is the initialization run and container is the document body
// if(!firstRun): container is a new contianer added to DOM, to be checked
function findNewsfeedAds(container, firstRun, resultFunction) {
    // Conditions for a newsfeed ad container.
    var adArgs = {
        "container": container,
        "includeContainer": !firstRun,
        "element": "div",
        "size": {
            "width": {"min": 450, "max": 550},
        },
        "cssMatches": [
            {"prop": "border-left-width", "val": "1px"},
            {"prop": "border-right-width", "val": "1px"}
        ]
    };
    // Find the set of possible containers to search
    var possibleNewsfeedAds = findContainers(adArgs);
    // Apply the result function to ads
    checkTextAndOrLink(possibleNewsfeedAds, false, resultFunction, textPossibilities);
}


// Find sideebar ads and apply the result function
function findSidebarAds(container, firstrun, resultFunction) {
    // If(firstRun): look at sidebar, and only the one with siblings (outermost);
    // If (!firstRun): just look in container
    var adSearchArea = container;
    var properSiblings = null;
    if (firstrun) {
        var sidebarArgs = {
            "container": container,
            "element": "div",
            "isSidebar": true
        };
        adSearchArea = findContainers(sidebarArgs);
        properSiblings = {"min": 1, "max": null};
    }
    var adArgs = {
        "container": adSearchArea,
        "element": "div",
        "size": {
            "width": {"min": 225, "max": 325},
            "height": {"min": 225, "max": 550}
        },
        "hasSiblings": properSiblings
    };
    // Find the set of possible containers to search
    var possibleSidebarAds = findContainers(adArgs);
    // Apply the result function to ads
    checkTextAndOrLink(possibleSidebarAds, true, resultFunction, textPossibilities);
  }

// Find newsfeed and sidebar ads, and apply the result function to them.
function findAds(container, firstRun, resultFunction) {
    if (container.find) {
        findNewsfeedAds(container, firstRun, resultFunction);
        findSidebarAds(container, firstRun, resultFunction);
    }
}

/* ----------------------------------------------------------------------------------
 * Business logic triggered on page access
 * ----------------------------------------------------------------------------------
 */

// Determine the locale if possible
var res = getLocale();
if (res !== null) {
    textPossibilities = res;
}

// Initial run to send ads
findAds($("body"), true, convertContainerToAd);

// This looks for changes in the DOM that correspond to new ads being created
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        // if content was added, examine the ads and look for new information
        if (mutation.addedNodes.length > 0) {
            findAds($(mutation.addedNodes), false, convertContainerToAd);
        }
    });
});
observer.observe(document, {childList: true, subtree: true});