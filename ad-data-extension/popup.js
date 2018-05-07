/* ----------------------------------------------------------------------------------
 * Author: Bharath Srivatsan
 * Date Written: Feb '18
 * Description: Populates an AWS database with relevant user information. Locally 
 *  persists a copy of a user's last submission
 * Dependencies: jquery.js, user.js
 * ----------------------------------------------------------------------------------
 */

// Listen for popup loads, engage function
window.addEventListener("load", function(event) {
    // DEBUG CODE
    // chrome.storage.local.clear(function() {})
    // chrome.storage.sync.clear(function() {})
    // toggleLottery()
    // setTwoWeekAlarm();
    chrome.storage.sync.get(null, function(items) {
        persistData() 
        document.getElementById("savebtn").addEventListener("click", function() {       
            saveSubmission(items, function(privateData, data) {
                sendSubmission(privateData, data)
            })
            completeAnimation();            
        });        
        if (items.longEnough != null) {
            toggleLottery()
            document.getElementById("lotterybtn").addEventListener("click", enterLottery)            
        }
        return true;
    });
    document.getElementById("instructions_link").addEventListener("click", function() {
        chrome.tabs.create({active: true, url: "https://drive.google.com/file/d/1YFFNvKAbEap-IPYdm10NGfKZqs-yhyPK/view?usp=sharing"});
    });
    document.getElementById("ov_link").addEventListener("click", function() {
        chrome.tabs.create({active: true, url: "https://drive.google.com/file/d/1GI7fvTyxsH_3iKl_UbDN3f4QcHSl9QoG/view?usp=sharing"});
    });
})

// Send form submission to database
function sendSubmission(privateData, data) {
    // Encrypt private data, store all data in server
    getUserId(function(uid) {
        encrypt(privateData, function(privateDataStr) {  
            var dataStr = JSON.stringify(data)
            var info = new Object();
            info.uid = uid;
            info.data = dataStr;
            info.privateData = privateDataStr;
            //var info = "{ \"userid\":" + uid + ", \"data\":" + dataStr + ", \"privateData\":" + privateDataStr +"}"
            
            chrome.runtime.sendMessage({msg:'send_to_AWS', type: "USER", data: info});
        })
    })
}

// Save form submission, update relevant fields
function saveSubmission(items, callback) {
    event.preventDefault();
    event.stopPropagation();     

    // Validate form without submitting (works on Chrome 40+)
    if(!$("#userform")[0].checkValidity()) {
        $("#userform")[0].reportValidity()
        return false
    }

    var privateData = new Object();
    var data = new Object();
    
    // SECTION 1:
    // Collect form elements
    var fname = document.getElementById("fname").value 
    var lname = document.getElementById("lname").value
    var bday = document.getElementById("bday").value
    var ccity = document.getElementById("ccity").value
    var cstate = document.getElementById("cstate").value
    var ccountry = document.getElementById("ccountry").value
    var hcity = document.getElementById("hcity").value
    var hstate = document.getElementById("hstate").value
    var hcountry = document.getElementById("hcountry").value   
    
    // Store updated values in local store
    // (personal data should not be synced to chrome servers)
    try {
        chrome.storage.local.set({'fname': fname}, function() {});
        chrome.storage.local.set({'lname': lname}, function() {});
        chrome.storage.local.set({'bday': bday}, function() {});
        chrome.storage.local.set({'ccity': ccity}, function() {});
        chrome.storage.local.set({'cstate': cstate}, function() {});
        chrome.storage.local.set({'ccountry': ccountry}, function() {});
        chrome.storage.local.set({'hcity': hcity}, function() {});
        chrome.storage.local.set({'hstate': hstate}, function() {});
        chrome.storage.local.set({'hcountry': hcountry}, function() {});
    } catch(e) {
        console.log(e);
    }
    
    // Update data object with relevant fields
    privateData.fname = fname
    privateData.lname = lname
    privateData.bday = bday
    privateData.ccity = ccity
    privateData.cstate = cstate
    privateData.ccountry = ccountry
    privateData.hcity = hcity
    privateData.hstate = hstate
    privateData.hcountry = hcountry
    
    privateData = removeEmpty(privateData);

    // SECTION 2:
    // Collect form elements
    var age = document.getElementById("age").value 
    var gender = document.getElementById("gender").value 
    var black = document.getElementById("black").checked 
    var amerindian = document.getElementById("amerindian").checked 
    var asian = document.getElementById("asian").checked 
    var hisplat = document.getElementById("hisplat").checked 
    var hawaii = document.getElementById("hawaii").checked 
    var white = document.getElementById("white").checked
    var edu = document.getElementById("edu").value 
    
    // Store updated values in synced store
    try {
        if(items.age != age) chrome.storage.sync.set({'age': age}, function() {});
        if(items.gender != gender) chrome.storage.sync.set({'gender': gender}, function() {});
        if(items.black != black) chrome.storage.sync.set({'black': black}, function() {});
        if(items.amerindian != amerindian) chrome.storage.sync.set({'amerindian': amerindian}, function() {});
        if(items.asian != asian) chrome.storage.sync.set({'asian': asian}, function() {});
        if(items.hisplat != hisplat) chrome.storage.sync.set({'hisplat': hisplat}, function() {});
        if(items.hawaii != hawaii) chrome.storage.sync.set({'hawaii': hawaii}, function() {});
        if(items.white != white) chrome.storage.sync.set({'white': white}, function() {});
        if(items.edu != edu) chrome.storage.sync.set({'edu': edu}, function() {});       
    } catch(e) {
        console.log(e);
    }

    // Update data object with relevant fields
    data.age = age
    data.gender = gender
    data.black = black
    data.amerindian = amerindian
    data.asian = asian
    data.hisplat = hisplat
    data.hawaii = hawaii
    data.white = white
    data.edu = edu

    // SECTION 3:
    // Collect form elements
    var clrcookies = document.getElementById("clrcookies").value 
    var incog = document.getElementById("incog").value 
    var cookie = document.getElementById("cookie").checked 
    var jsblock = document.getElementById("jsblock").checked 
    var loc = document.getElementById("loc").checked 
    var pluginblk = document.getElementById("pluginblk").checked 
    var adblockyes = document.getElementById("adblockyes").checked 
    var adblockno = document.getElementById("adblockno").checked 
    var dntyes = document.getElementById("dntyes").checked 
    var dntno = document.getElementById("dntno").checked 
    var loggedIn = document.getElementById("loggedIn").value     

    // Store updated values in synced store
    try {
        if(items.clrcookies != clrcookies) chrome.storage.sync.set({'clrcookies': clrcookies}, function() {});
        if(items.incog != incog) chrome.storage.sync.set({'incog': incog}, function() {});
        if(items.cookie != cookie) chrome.storage.sync.set({'cookie': cookie}, function() {});
        if(items.jsblock != jsblock) chrome.storage.sync.set({'jsblock': jsblock}, function() {});
        if(items.loc != loc) chrome.storage.sync.set({'loc': loc}, function() {});
        if(items.pluginblk != pluginblk) chrome.storage.sync.set({'pluginblk': pluginblk}, function() {});
        if(items.adblockyes != adblockyes) chrome.storage.sync.set({'adblockyes': adblockyes}, function() {});
        if(items.adblockno != adblockno) chrome.storage.sync.set({'adblockno': adblockno}, function() {});
        if(items.dntyes != dntyes) chrome.storage.sync.set({'dntyes': dntyes}, function() {});
        if(items.dntno != dntno) chrome.storage.sync.set({'dntno': dntno}, function() {});
        if(items.loggedIn != loggedIn) chrome.storage.sync.set({'loggedIn': loggedIn}, function() {});           
    } catch(e) {
        console.log(e);
    } 

    // Update data object with relevant fields
    data.clrcookies = clrcookies
    data.incog = incog
    data.cookie = cookie
    data.jsblock = jsblock
    data.loc = loc
    data.pluginblk = pluginblk
    data.adblockyes = adblockyes
    data.adblockno = adblockno
    data.dntyes = dntyes
    data.dntno = dntno
    data.loggedIn = loggedIn    

    // SECTION 4:
    // Collect form elements   
    var googleinterests = document.getElementById("googleinterests").value 
    var gIntP1 = document.getElementById("gIntP1").checked 
    var gIntP2 = document.getElementById("gIntP2").checked 
    var gIntP3 = document.getElementById("gIntP3").checked 
    var gIntP4 = document.getElementById("gIntP4").checked 
    var gIntP5 = document.getElementById("gIntP5").checked 
    var gIntR1 = document.getElementById("gIntR1").checked 
    var gIntR2 = document.getElementById("gIntR2").checked 
    var gIntR3 = document.getElementById("gIntR3").checked 
    var gIntR4 = document.getElementById("gIntR4").checked 
    var gIntR5 = document.getElementById("gIntR5").checked
    var gGender = document.getElementById("gGender").value 
    var gAge = document.getElementById("gAge").value 
    var fbinterests = document.getElementById("fbinterests").value 
    var fbIntP1 = document.getElementById("fbIntP1").checked 
    var fbIntP2 = document.getElementById("fbIntP2").checked 
    var fbIntP3 = document.getElementById("fbIntP3").checked 
    var fbIntP4 = document.getElementById("fbIntP4").checked 
    var fbIntP5 = document.getElementById("fbIntP5").checked 
    var fbIntR1 = document.getElementById("fbIntR1").checked 
    var fbIntR2 = document.getElementById("fbIntR2").checked 
    var fbIntR3 = document.getElementById("fbIntR3").checked 
    var fbIntR4 = document.getElementById("fbIntR4").checked 
    var fbIntR5 = document.getElementById("fbIntR5").checked 
    var fbcategories = document.getElementById("fbcategories").value 
    var fbCat1 = document.getElementById("fbCat1").checked 
    var fbCat2 = document.getElementById("fbCat2").checked 
    var fbCat3 = document.getElementById("fbCat3").checked 
    var fbCat4 = document.getElementById("fbCat4").checked 
    var fbCat5 = document.getElementById("fbCat5").checked 

    // Store updated values in synced store
    try {
        if(items.googleinterests != googleinterests) chrome.storage.sync.set({'googleinterests': googleinterests}, function() {});
        if(items.gIntP1 != gIntP1) chrome.storage.sync.set({'gIntP1': gIntP1}, function() {});
        if(items.gIntP2 != gIntP2) chrome.storage.sync.set({'gIntP2': gIntP2}, function() {});
        if(items.gIntP3 != gIntP3) chrome.storage.sync.set({'gIntP3': gIntP3}, function() {});
        if(items.gIntP4 != gIntP4) chrome.storage.sync.set({'gIntP4': gIntP4}, function() {});
        if(items.gIntP5 != gIntP5) chrome.storage.sync.set({'gIntP5': gIntP5}, function() {});
        if(items.gIntR1 != gIntR1) chrome.storage.sync.set({'gIntR1': gIntR1}, function() {});
        if(items.gIntR2 != gIntR2) chrome.storage.sync.set({'gIntR2': gIntR2}, function() {});
        if(items.gIntR3 != gIntR3) chrome.storage.sync.set({'gIntR3': gIntR3}, function() {});
        if(items.gIntR4 != gIntR4) chrome.storage.sync.set({'gIntR4': gIntR4}, function() {});
        if(items.gIntR5 != gIntR5) chrome.storage.sync.set({'gIntR5': gIntR5}, function() {});  
        if(items.gGender != gGender) chrome.storage.sync.set({'gGender': gGender}, function() {});
        if(items.gAge != gAge) chrome.storage.sync.set({'gAge': gAge}, function() {});
        if(items.fbinterests != fbinterests) chrome.storage.sync.set({'fbinterests': fbinterests}, function() {});
        if(items.fbIntP1 != fbIntP1) chrome.storage.sync.set({'fbIntP1': fbIntP1}, function() {});
        if(items.fbIntP2 != fbIntP2) chrome.storage.sync.set({'fbIntP2': fbIntP2}, function() {});
        if(items.fbIntP3 != fbIntP3) chrome.storage.sync.set({'fbIntP3': fbIntP3}, function() {});
        if(items.fbIntP4 != fbIntP4) chrome.storage.sync.set({'fbIntP4': fbIntP4}, function() {});
        if(items.fbIntP5 != fbIntP5) chrome.storage.sync.set({'fbIntP5': fbIntP5}, function() {});
        if(items.fbIntR1 != fbIntR1) chrome.storage.sync.set({'fbIntR1': fbIntR1}, function() {});
        if(items.fbIntR2 != fbIntR2) chrome.storage.sync.set({'fbIntR2': fbIntR2}, function() {});
        if(items.fbIntR3 != fbIntR3) chrome.storage.sync.set({'fbIntR3': fbIntR3}, function() {});
        if(items.fbIntR4 != fbIntR4) chrome.storage.sync.set({'fbIntR4': fbIntR4}, function() {});
        if(items.fbIntR5 != fbIntR5) chrome.storage.sync.set({'fbIntR5': fbIntR5}, function() {});
        if(items.fbcategories != fbcategories) chrome.storage.sync.set({'fbcategories': fbcategories}, function() {});
        if(items.fbCat1 != fbCat1) chrome.storage.sync.set({'fbCat1': fbCat1}, function() {});
        if(items.fbCat2 != fbCat2) chrome.storage.sync.set({'fbCat2': fbCat2}, function() {});
        if(items.fbCat3 != fbCat3) chrome.storage.sync.set({'fbCat3': fbCat3}, function() {});
        if(items.fbCat4 != fbCat4) chrome.storage.sync.set({'fbCat4': fbCat4}, function() {});
        if(items.fbCat5 != fbCat5) chrome.storage.sync.set({'fbCat5': fbCat5}, function() {});
    } catch(e) {
        console.log(e);
    }

    // Update data object with relevant fields
    data.googleinterests = googleinterests
    data.gIntP1 = gIntP1
    data.gIntP2 = gIntP2
    data.gIntP3 = gIntP3
    data.gIntP4 = gIntP4
    data.gIntP5 = gIntP5
    data.gIntR1 = gIntR1
    data.gIntR2 = gIntR2
    data.gIntR3 = gIntR3
    data.gIntR4 = gIntR4
    data.gIntR5 = gIntR5   
    data.gGender = gGender
    data.gAge = gAge
    data.fbinterests = fbinterests
    data.fbIntP1 = fbIntP1
    data.fbIntP2 = fbIntP2
    data.fbIntP3 = fbIntP3
    data.fbIntP4 = fbIntP4
    data.fbIntP5 = fbIntP5
    data.fbIntR1 = fbIntR1
    data.fbIntR2 = fbIntR2
    data.fbIntR3 = fbIntR3
    data.fbIntR4 = fbIntR4
    data.fbIntR5 = fbIntR5
    data.fbcategories = fbcategories    
    data.fbCat1 = fbCat1
    data.fbCat2 = fbCat2
    data.fbCat3 = fbCat3
    data.fbCat4 = fbCat4
    data.fbCat5 = fbCat5


    // SECTION 5:
    // Collect form elements   
    var aretarget1 = document.getElementById("aretarget1").checked 
    var aretarget2 = document.getElementById("aretarget2").checked 
    var aretarget3 = document.getElementById("aretarget3").checked 
    var aretarget4 = document.getElementById("aretarget4").checked 
    var aretarget5 = document.getElementById("aretarget5").checked 
    var wanttarget1 = document.getElementById("wanttarget1").checked 
    var wanttarget2 = document.getElementById("wanttarget2").checked 
    var wanttarget3 = document.getElementById("wanttarget3").checked 
    var wanttarget4 = document.getElementById("wanttarget4").checked 
    var wanttarget5 = document.getElementById("wanttarget5").checked
    var goog_trust1 = document.getElementById("goog_trust1").checked 
    var goog_trust2 = document.getElementById("goog_trust2").checked 
    var goog_trust3 = document.getElementById("goog_trust3").checked 
    var goog_trust4 = document.getElementById("goog_trust4").checked 
    var goog_trust5 = document.getElementById("goog_trust5").checked 
    var fb_trust1 = document.getElementById("fb_trust1").checked 
    var fb_trust2 = document.getElementById("fb_trust2").checked 
    var fb_trust3 = document.getElementById("fb_trust3").checked 
    var fb_trust4 = document.getElementById("fb_trust4").checked 
    var fb_trust5 = document.getElementById("fb_trust5").checked 
    var third_trust1 = document.getElementById("third_trust1").checked 
    var third_trust2 = document.getElementById("third_trust2").checked 
    var third_trust3 = document.getElementById("third_trust3").checked 
    var third_trust4 = document.getElementById("third_trust4").checked 
    var third_trust5 = document.getElementById("third_trust5").checked 
    var pvt = document.getElementById("pvt").value
    var surprise = document.getElementById("surprise").value 
    var browse_change = document.getElementById("browse_change").value   

    // Store updated values in synced store
    try {
        if(items.aretarget1 != aretarget1) chrome.storage.sync.set({'aretarget1': aretarget1}, function() {});
        if(items.aretarget2 != aretarget2) chrome.storage.sync.set({'aretarget2': aretarget2}, function() {});
        if(items.aretarget3 != aretarget3) chrome.storage.sync.set({'aretarget3': aretarget3}, function() {});
        if(items.aretarget4 != aretarget4) chrome.storage.sync.set({'aretarget4': aretarget4}, function() {});
        if(items.aretarget5 != aretarget5) chrome.storage.sync.set({'aretarget5': aretarget5}, function() {});
        if(items.wanttarget1 != wanttarget1) chrome.storage.sync.set({'wanttarget1': wanttarget1}, function() {});
        if(items.wanttarget2 != wanttarget2) chrome.storage.sync.set({'wanttarget2': wanttarget2}, function() {});
        if(items.wanttarget3 != wanttarget3) chrome.storage.sync.set({'wanttarget3': wanttarget3}, function() {});
        if(items.wanttarget4 != wanttarget4) chrome.storage.sync.set({'wanttarget4': wanttarget4}, function() {});
        if(items.wanttarget5 != wanttarget5) chrome.storage.sync.set({'wanttarget5': wanttarget5}, function() {});  
        if(items.goog_trust1 != goog_trust1) chrome.storage.sync.set({'goog_trust1': goog_trust1}, function() {});
        if(items.goog_trust2 != goog_trust2) chrome.storage.sync.set({'goog_trust2': goog_trust2}, function() {});
        if(items.goog_trust3 != goog_trust3) chrome.storage.sync.set({'goog_trust3': goog_trust3}, function() {});
        if(items.goog_trust4 != goog_trust4) chrome.storage.sync.set({'goog_trust4': goog_trust4}, function() {});
        if(items.goog_trust5 != goog_trust5) chrome.storage.sync.set({'goog_trust5': goog_trust5}, function() {});
        if(items.fb_trust1 != fb_trust1) chrome.storage.sync.set({'fb_trust1': fb_trust1}, function() {});
        if(items.fb_trust2 != fb_trust2) chrome.storage.sync.set({'fb_trust2': fb_trust2}, function() {});
        if(items.fb_trust3 != fb_trust3) chrome.storage.sync.set({'fb_trust3': fb_trust3}, function() {});
        if(items.fb_trust4 != fb_trust4) chrome.storage.sync.set({'fb_trust4': fb_trust4}, function() {});
        if(items.fb_trust5 != fb_trust5) chrome.storage.sync.set({'fb_trust5': fb_trust5}, function() {});
        if(items.third_trust1 != third_trust1) chrome.storage.sync.set({'third_trust1': third_trust1}, function() {});
        if(items.third_trust2 != third_trust2) chrome.storage.sync.set({'third_trust2': third_trust2}, function() {});
        if(items.third_trust3 != third_trust3) chrome.storage.sync.set({'third_trust3': third_trust3}, function() {});
        if(items.third_trust4 != third_trust4) chrome.storage.sync.set({'third_trust4': third_trust4}, function() {});
        if(items.third_trust5 != third_trust5) chrome.storage.sync.set({'third_trust5': third_trust5}, function() {});
        if(items.pvt != pvt) chrome.storage.sync.set({'pvt': pvt}, function() {});
        if(items.surprise != surprise) chrome.storage.sync.set({'surprise': surprise}, function() {});
        if(items.browse_change != browse_change) chrome.storage.sync.set({'browse_change': browse_change}, function() {});
    } catch(e) {
        console.log(e);
    }

    // Update data object with relevant fields
    data.aretarget1 = aretarget1
    data.aretarget2 = aretarget2
    data.aretarget3 = aretarget3
    data.aretarget4 = aretarget4
    data.aretarget5 = aretarget5
    data.wanttarget1 = wanttarget1
    data.wanttarget2 = wanttarget2
    data.wanttarget3 = wanttarget3
    data.wanttarget4 = wanttarget4
    data.wanttarget5 = wanttarget5   
    data.goog_trust1 = goog_trust1
    data.goog_trust2 = goog_trust2
    data.goog_trust3 = goog_trust3
    data.goog_trust4 = goog_trust4
    data.goog_trust5 = goog_trust5
    data.fb_trust1 = fb_trust1
    data.fb_trust2 = fb_trust2
    data.fb_trust3 = fb_trust3
    data.fb_trust4 = fb_trust4
    data.fb_trust5 = fb_trust5
    data.third_trust1 = third_trust1
    data.third_trust2 = third_trust2
    data.third_trust3 = third_trust3
    data.third_trust4 = third_trust4
    data.third_trust5 = third_trust5
    data.pvt = pvt
    data.surprise = surprise
    data.browse_change = browse_change

    data = removeEmpty(data);    
    data.googleinterests = data.googleinterests == null ? null : JSON.stringify(data.googleinterests);
    data.fbinterests = data.fbinterests == null ? null : JSON.stringify(data.fbinterests);
    data.fbcategories = data.fbcategories == null ? null : JSON.stringify(data.fbcategories);    
    
    callback(privateData, data);
}

// Repopulate fields with stored data from previous submission
function persistData() {
    // Populate section 1
    chrome.storage.local.get(null, function(items) {
        if (items.fname != null) 
        {document.getElementById('fname').value = items.fname}
        if (items.lname != null) 
        {document.getElementById('lname').value = items.lname}
        if (items.bday != null) 
        {document.getElementById('bday').value = items.bday}
        if (items.ccity != null) 
        {document.getElementById('ccity').value = items.ccity}
        if (items.cstate != null) 
        {document.getElementById('cstate').value = items.cstate}
        if (items.ccountry != null) 
        {document.getElementById('ccountry').value = items.ccountry}
        if (items.hcity != null) 
        {document.getElementById('hcity').value = items.hcity}
        if (items.hstate != null) 
        {document.getElementById('hstate').value = items.hstate}
        if (items.hcountry != null) 
        {document.getElementById('hcountry').value = items.hcountry}
    })

    // Populate sections 2, 3, 4
    chrome.storage.sync.get(null, function(items) {
        if (items.age != null) 
        {document.getElementById('age').value = items.age}
        if (items.gender != null) 
        {document.getElementById('gender').value = items.gender}
        if (items.black != null) 
        {document.getElementById('black').checked = items.black}
        if (items.amerindian != null) 
        {document.getElementById('amerindian').checked = items.amerindian}
        if (items.asian != null) 
        {document.getElementById('asian').checked = items.asian}
        if (items.hisplat != null) 
        {document.getElementById('hisplat').checked = items.hisplat}
        if (items.hawaii != null) 
        {document.getElementById('hawaii').checked = items.hawaii}
        if (items.white != null) 
        {document.getElementById('white').checked = items.white}
        if (items.edu != null) 
        {document.getElementById('edu').value = items.edu}
        if (items.clrcookies != null) 
        {document.getElementById('clrcookies').value = items.clrcookies}
        if (items.incog != null) 
        {document.getElementById('incog').value = items.incog}
        if (items.cookie != null) 
        {document.getElementById('cookie').checked = items.cookie}
        if (items.jsblock != null) 
        {document.getElementById('jsblock').checked = items.jsblock}
        if (items.loc != null) 
        {document.getElementById('loc').checked = items.loc}
        if (items.pluginblk != null) 
        {document.getElementById('pluginblk').checked = items.pluginblk}
        if (items.adblockyes != null) 
        {document.getElementById('adblockyes').checked = items.adblockyes}
        if (items.adblockno != null) 
        {document.getElementById('adblockno').checked = items.adblockno}
        if (items.dntyes != null) 
        {document.getElementById('dntyes').checked = items.dntyes}
        if (items.dntno != null) 
        {document.getElementById('dntno').checked = items.dntno}
        if (items.loggedIn != null) 
        {document.getElementById('loggedIn').value = items.loggedIn}
        if (items.googleinterests != null) 
        {document.getElementById('googleinterests').value = items.googleinterests}
        if (items.gIntP1 != null)
        {document.getElementById('gIntP1').checked = items.gIntP1}
        if (items.gIntP2 != null)
        {document.getElementById('gIntP2').checked = items.gIntP2}
        if (items.gIntP3 != null)
        {document.getElementById('gIntP3').checked = items.gIntP3}
        if (items.gIntP4 != null)
        {document.getElementById('gIntP4').checked = items.gIntP4}
        if (items.gIntP5 != null)
        {document.getElementById('gIntP5').checked = items.gIntP5}
        if (items.gIntR1 != null)
        {document.getElementById('gIntR1').checked = items.gIntR1}
        if (items.gIntR2 != null)
        {document.getElementById('gIntR2').checked = items.gIntR2}
        if (items.gIntR3 != null)
        {document.getElementById('gIntR3').checked = items.gIntR3}
        if (items.gIntR4 != null)
        {document.getElementById('gIntR4').checked = items.gIntR4}
        if (items.gIntR5 != null)
        {document.getElementById('gIntR5').checked = items.gIntR5}
        if (items.gGender != null)
        {document.getElementById('gGender').value = items.gGender}
        if (items.gAge != null)
        {document.getElementById('gAge').value = items.gAge}
        if (items.fbinterests != null) 
        {document.getElementById('fbinterests').value = items.fbinterests}
        if (items.fbIntP1 != null)
        {document.getElementById('fbIntP1').checked = items.fbIntP1}
        if (items.fbIntP2 != null)
        {document.getElementById('fbIntP2').checked = items.fbIntP2}
        if (items.fbIntP3 != null)
        {document.getElementById('fbIntP3').checked = items.fbIntP3}
        if (items.fbIntP4 != null)
        {document.getElementById('fbIntP4').checked = items.fbIntP4}
        if (items.fbIntP5 != null)
        {document.getElementById('fbIntP5').checked = items.fbIntP5}
        if (items.fbIntR1 != null)
        {document.getElementById('fbIntR1').checked = items.fbIntR1}
        if (items.fbIntR2 != null)
        {document.getElementById('fbIntR2').checked = items.fbIntR2}
        if (items.fbIntR3 != null)
        {document.getElementById('fbIntR3').checked = items.fbIntR3}
        if (items.fbIntR4 != null)
        {document.getElementById('fbIntR4').checked = items.fbIntR4}
        if (items.fbIntR5 != null)
        {document.getElementById('fbIntR5').checked = items.fbIntR5}
        if (items.fbcategories != null) 
        {document.getElementById('fbcategories').value = items.fbcategories}
        if (items.fbCat1 != null)
        {document.getElementById('fbCat1').checked = items.fbCat1}
        if (items.fbCat2 != null)
        {document.getElementById('fbCat2').checked = items.fbCat2}
        if (items.fbCat3 != null)
        {document.getElementById('fbCat3').checked = items.fbCat3}
        if (items.fbCat4 != null)
        {document.getElementById('fbCat4').checked = items.fbCat4}
        if (items.fbCat5 != null)
        {document.getElementById('fbCat5').checked = items.fbCat5}
        if (items.aretarget1 != null)
        {document.getElementById('aretarget1').checked = items.aretarget1}
        if (items.aretarget2 != null)
        {document.getElementById('aretarget2').checked = items.aretarget2}
        if (items.aretarget3 != null)
        {document.getElementById('aretarget3').checked = items.aretarget3}
        if (items.aretarget4 != null)
        {document.getElementById('aretarget4').checked = items.aretarget4}
        if (items.aretarget5 != null)
        {document.getElementById('aretarget5').checked = items.aretarget5}
        if (items.wanttarget1 != null)
        {document.getElementById('wanttarget1').checked = items.wanttarget1}
        if (items.wanttarget2 != null)
        {document.getElementById('wanttarget2').checked = items.wanttarget2}
        if (items.wanttarget3 != null)
        {document.getElementById('wanttarget3').checked = items.wanttarget3}
        if (items.wanttarget4 != null)
        {document.getElementById('wanttarget4').checked = items.wanttarget4}
        if (items.wanttarget5 != null)
        {document.getElementById('wanttarget5').checked = items.wanttarget5}
        if (items.goog_trust1 != null)
        {document.getElementById('goog_trust1').checked = items.goog_trust1}
        if (items.goog_trust2 != null)
        {document.getElementById('goog_trust2').checked = items.goog_trust2}
        if (items.goog_trust3 != null)
        {document.getElementById('goog_trust3').checked = items.goog_trust3}
        if (items.goog_trust4 != null)
        {document.getElementById('goog_trust4').checked = items.goog_trust4}
        if (items.goog_trust5 != null)
        {document.getElementById('goog_trust5').checked = items.goog_trust5}
        if (items.fb_trust1 != null)
        {document.getElementById('fb_trust1').checked = items.fb_trust1}
        if (items.fb_trust2 != null)
        {document.getElementById('fb_trust2').checked = items.fb_trust2}
        if (items.fb_trust3 != null)
        {document.getElementById('fb_trust3').checked = items.fb_trust3}
        if (items.fb_trust4 != null)
        {document.getElementById('fb_trust4').checked = items.fb_trust4}
        if (items.fb_trust5 != null)
        {document.getElementById('fb_trust5').checked = items.fb_trust5}
        if (items.third_trust1 != null)
        {document.getElementById('third_trust1').checked = items.third_trust1}
        if (items.third_trust2 != null)
        {document.getElementById('third_trust2').checked = items.third_trust2}
        if (items.third_trust3 != null)
        {document.getElementById('third_trust3').checked = items.third_trust3}
        if (items.third_trust4 != null)
        {document.getElementById('third_trust4').checked = items.third_trust4}
        if (items.third_trust5 != null)
        {document.getElementById('third_trust5').checked = items.third_trust5}
        if (items.pvt != null)
        {document.getElementById('pvt').value = items.pvt}
        if (items.surprise != null)
        {document.getElementById('surprise').value = items.surprise}
        if (items.browse_change != null)
        {document.getElementById('browse_change').value = items.browse_change}
    })
}

// Changes box colors to green and text of save button, to indicate success
// Uses snippets from: https://awesometoast.com/flashpulse-a-border-color-with-jquery/
// and https://stackoverflow.com/questions/9315041/jquery-wait-a-number-of-seconds-before-the-next-line-of-code-is-executed
function completeAnimation() {
    $("#savebtn").html("Saved!")
    var original_color = $("#s1").css('borderColor');

    $("#s1").css({borderColor:'green'})
    $("#s2").css({borderColor:'green'})
    $("#s3").css({borderColor:'green'})    
    $("#s4").css({borderColor:'green'})
    $("#s5").css({borderColor:'green'})

    window.setTimeout(function (){
        $("#s1").css({borderColor:original_color}); 
        $("#s2").css({borderColor:original_color}); 
        $("#s3").css({borderColor:original_color});         
        $("#s4").css({borderColor:original_color}); 
        $("#s5").css({borderColor:original_color}); 
        $("#savebtn").html("Save")
    }, 2000);
}

// Toggles lottery entry visibility
function toggleLottery() {
    getUserId(function(uid) {
        document.getElementById("lottery").style.display = "block";
        document.getElementById("lottery_uid").innerText = uid;
    });
}

// Allows users to enter lottery
function enterLottery() {
    // Validate form without submitting (works on Chrome 40+)
    event.preventDefault();
    event.stopPropagation();
    if(!$("#lotteryform")[0].checkValidity()) {
        $("#lotteryform")[0].reportValidity()
        return false
    }

    // Make sure the lottery submission is valid
    chrome.storage.sync.get(null, function(items) {
        var currentTime = Date.now();
        var startTime = Date.now();
        if (items.startTime != null) {
            startTime = items.startTime;
        }
        if (currentTime - startTime <= HOLD_TIME) {
            alert("Nice try, but you\'re not eligible for the lottery yet.")
            // NOTE: On the server side, checks are run to validate eligibility;
            // breaking this client check will not enter you successfully
        }
        else {
            var email = document.getElementById("email").value 
            var submission = new Object();
            submission.email = email;
            submission.startTime = startTime;
            submission.time = currentTime;
            submission.type = "LOTTERY";

            chrome.runtime.sendMessage({msg:'send_to_AWS', type: 'LOTTERY', data: submission});

            $("#lotterybtn").html("Submitted!")
            var original_color = $("#lottery").css('borderColor');
            $("#lottery").css({borderColor:'green'})
            window.setTimeout(function (){
                $("#lottery").css({borderColor:original_color}); 
                $("#lotterybtn").html("Update Entry")
            }, 2000);
        }
    });
}
