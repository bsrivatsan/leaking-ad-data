/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Performs type-agnostic miscellaneous ad processing functions, 
 *  including checking for PII and setting user metadata
 * Dependencies: user.js, jquery.js
 * ----------------------------------------------------------------------------------
 */

// Sets PII flags based on presence of PII in text
function checkPII(adURLObject, adContentObject, adMetadataObject, callback) {
    retrieveInfo(function(info) {
        var piiFlags = [];
        var urlFlags = [];
        var txt = adContentObject.text;
        var html = adContentObject.html;
        var urls = adURLObject.adURLs;
        var flags = adMetadataObject.flags;
        
        if (info != null) {
            $.each(info, function(key, value) {
                if (value == null) {
                    return;
                }

                if (txt.indexOf(value) >= 0) {
                    piiFlags.push(key);
                    txt.replace(value, key);
                } else if (html.indexOf(value) >= 0) {
                    piiFlags.push(key);
                    html.replace(value, key); 
                } else if (urls != null){
                    for (var i = 0; i < Object.keys(urls).length; i++) {
                        var url = urls[i];
                        if(url != null && url.indexOf(value) >= 0) {
                            urlFlags.push(key);
                            url.replace(value, key); 
                            urls[i] = url;
                        }
                    }
                }
            })
        }

        flags.PII = convertListToDict(piiFlags);
        flags.urlPII = convertListToDict(urlFlags);

        adMetadataObject.flags = flags;
        adContentObject.text = txt;
        adContentObject.html = html;
        adURLObject.adURLs = urls;
        callback(removeEmpty(adURLObject), removeEmpty(adContentObject), removeEmpty(adMetadataObject));
    });
}

// Sets user metadata
function setMetadata(adMetadataObj, callback) {
    getUserId(function(uid) {
        var rand = getRandomToken();
        var objid = uid + '_' + rand;
        
        adMetadataObj.objid = objid;
        adMetadataObj.uid = uid;
        adMetadataObj.time = Date.now();

        callback(adMetadataObj);
    });
}