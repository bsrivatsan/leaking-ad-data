/* ----------------------------------------------------------------------------------
 * Author: Grant Storey & Dillon Reisman, Bharath Srivatsan
 * Written: Nov '16
 * Last Updated: Feb '18
 * Description: Find containers on the page
 * Dependencies: jquery
 * Acknowledgements: Perceptual AdBlocker
 * ----------------------------------------------------------------------------------
 */


 /*
    Find container with given constraints:
        "container": container in which to search (as jquery item)
        "includeContainer": true if we want to include the container
        "element": tag name to search for (required)
        "size": size contraints
        "width": contains min and max desired width
            "min": minimum (null = 0)
            "max": maximum (null = infinity)
        "height": contains min and max desired height
            "min": minimum (null = 0)
            "max": maximum (null = infinity)
        "backgroundColor": background color, or null if none
        "isSidebar": if true, only include things that appear to be a sidebar.
        "hasSiblings": select containers with at least "min" and at most "max" siblings.
                    null to ignore
        "cssMatches": a list of property, value pairs, where the value of css
                    property "prop" should match "val"
    
    Example call:
        var iframeArgs = {
            "element": "div",
            "size": {
                "width": {"min": 10, "max": 100},
                "height": {"min": 10, "max": 100}
            },
            "backgroundColor": "red",
            "isSidebar": true
        };
 */

function findContainers(args) {
    var tagName = args["element"];
    var possibles;

    // if we want to include the container and are able to examine it
    // then include it in the selection.
    if (args["includeContainer"]) {
        possibles = args["container"].find(args["element"]).addBack();
    } else {
        possibles = args["container"].find(args["element"]);
    }

    // Filter candidates to most likely containers
    possibles = possibles.filter(function(item) {
        // if this isn't an element, it isn't a possible container.
        if (!this.tagName) {
            return false;
        }

        /* ***************
        * Ensure Proper Size
        * ***************/
        var properSize = true;
        if(args["size"]) {
            var underMaxWidth = true;
            var overMinWidth = true;
            var underMaxHeight = true;
            var overMinHeight = true;
            if (args["size"]["width"] && args["size"]["width"]["max"]) {
                underMaxWidth = $(this).width() <= args["size"]["width"]["max"];
            }
            if (args["size"]["width"] && args["size"]["width"]["min"]) {
                overMinWidth = $(this).width() >= args["size"]["width"]["min"];
            }
            if (args["size"]["height"] && args["size"]["height"]["max"]) {
                underMaxHeight = $(this).height() <= args["size"]["height"]["max"];
            }
            if (args["size"]["height"] && args["size"]["height"]["min"]) {
                overMinHeight = $(this).height() >= args["size"]["height"]["min"];
            }
            properSize = underMaxWidth && overMinWidth && underMaxHeight && overMinHeight;
        }

        /* ***************
        * Ensure Proper Background Color
        * ***************/
        var properColor = true;
        if(args["backgroundColor"]) {
            properColor = $(this).css("background-color") == args["backgroundColor"];
        }

        /* ***************
        * Ensure Sidebar
        * ***************/
        var properSidebar = true;
        if(args["isSidebar"]) {
            // width less than a third of total, height at least 80% of sum
            var properSize = ($(this).width()*3 <= window.innerWidth) && ($(this).height() >= 0.8*window.innerHeight);
            var leftSide = ($(this).offset().left + $(this).width()) < 0.5*window.innerWidth;
            var rightSide = $(this).offset().left > 0.5*window.innerWidth;
            properSidebar = properSize && (leftSide || rightSide);
        }

        /* ***************
        * Ensure Sibling Number
        * ***************/
        var properSiblings = true;
        if (args["hasSiblings"]) {
            var atLeastMin = true;
            var atMostMax = true;
            var numSiblings = $(this).siblings().length;
            if (args["hasSiblings"]["min"]) {
                atLeastMin = numSiblings >= args["hasSiblings"]["min"]
            }
            if (args["hasSiblings"]["max"]) {
                atMostMax = numSiblings <= args["hasSiblings"]["max"]
            }
            properSiblings = atLeastMin && atMostMax;
        }

        /* ***************
        * Ensure CSS Properties
        * ***************/
        var properCSSMatches = true;
        if (args["cssMatches"]) {
            for (var i = 0; i < args["cssMatches"].length; i++) {
                var match = args["cssMatches"][i];
                if (($(this).css(match["prop"]) != match["val"]) && (window.getComputedStyle($(this).get(0),':before').getPropertyValue(match["prop"]).replace(/\"/g, "") != match["val"]) && (window.getComputedStyle($(this).get(0),':after').getPropertyValue(match["prop"]).replace(/\"/g, "") != match["val"])) {
                    properCSSMatches = false;
                    break;
                }
            }
        }
    
        return (this.querySelector) && properSize && properColor && properSidebar && properSiblings && properCSSMatches;
 
    });
  
    return possibles;
}
