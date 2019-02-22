// Functions related to UI and account authorization

// Formats UI for finished upload
function uploadFinished(link) {
    msg();
    var msg = 'Success! Link: <a href="' + link + '">Click here!</a>';
    var linkElem = document.getElementById('link');
    // Update text
    linkElem.innerHTML = msg;
    linkElem.onclick = function() {
        chrome.tabs.create({ url: link });
    };
    stopRunning();
}

// Formats UI for Vol Score finished upload
function uploadFinishedVolScore(link) {
    msg();
    var msg = 'Success! Link: <a href="' + link + '">Click here!</a>';
    var linkElem = document.getElementById('volScoreLink');
    // Update text
    linkElem.innerHTML = msg;
    linkElem.onclick = function() {
        chrome.tabs.create({ url: link });
    };
    stopRunning();
}

function finishUpload(link, linkElem) {
    msg();
    var msg = 'Success! Link: <a href="' + link + '">Click here!</a>';
    var linkElem = document.getElementById('volScoreLink');
    // Update text
    linkElem.innerHTML = msg;
    linkElem.onclick = function() {
        chrome.tabs.create({ url: link });
    };
    stopRunning();
}

// Opens a tab for Shiftboard login
function doShiftboardLogin() {
    chrome.tabs.create({url: 'https://www.shiftboard.com/sxsw/'});
}

// Gets a Drive auth token
function getDriveToken(interactive, callbackFunc) {
    chrome.identity.getAuthToken({ 'interactive': interactive }, callbackFunc);
}

// Formats the date for Shiftboard export
function getDateStr(date) {
    var year = date.getFullYear();

    var month = '' + (date.getMonth() + 1);
    month = month.padStart(2, '0');

    var day = '' + date.getDate();
    day = day.padStart(2, '0');

    return year + month + day;
}

// Return date object from date picker
function getDate() {
    var picker = document.getElementById('datepicker');
    if (picker.value !== '') {
        let date = picker.valueAsDate;
        // Fix for timezone weirdness
        date.setMinutes(date.getTimezoneOffset() + date.getMinutes());
        return date;
    }
    return null;
}

// Show, hide various buttons
function showRevokeAuthBtn() {
    document.getElementById('revokeAuth').style.display = null;
}

function hideRevokeAuthBtn() {
    document.getElementById('revokeAuth').style.display = 'none';
}

function showDoAuthBtn() {
    document.getElementById('driveAuthBtn').style.display = null;
}

function hideDoAuthBtn() {
    document.getElementById('driveAuthBtn').style.display = 'none';
}

// Display a message, or an error
function msg(m) {
    if (msg === null) {
        // Null param will clear msg
        document.getElementById('error').innerHTML = '';
    } else {
        document.getElementById('error').innerHTML = m;
    }
}

// Display current auth status for Drive in UI
function showDriveAuthDetails(interactive) {
    getDriveToken(interactive, function(token) {
        if (token != null) {
            chrome.identity.getProfileUserInfo(function () {
                // Switch the buttons
                showRevokeAuthBtn();
                hideDoAuthBtn();
            });
            msg();
        }
    });
}

// Logouts current Drive account
function revokeDriveAuth() {
    getDriveToken(false, function(token) {
        if (token != null) {
            chrome.identity.removeCachedAuthToken({ token: token });
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + token);
            xhr.send();
            // Hide the UI
            hideRevokeAuthBtn();
            showDoAuthBtn();
            // Success!
            msg('Successfully logged out of Drive.');
        } else {
            // Trying to revoke a null token!! Error
            msg('Error: Cannot revoke null token.');
        }
    });
}

// Shared action for clicking 'Roster' or 'Links' button
// Simply uses a different callback for each
function exportClickAction(callback) {
    return new function () {
        if (isRunning()) {
            console.log('Export is already running!');
            return;
        }
        startRunning();

        // Reset link field
        document.getElementById('link').innerHTML = '';
        // Check for a valid date
        var date = getDate();
        if (date != null) {
            // Generate the report
            callback(date);
        } else {
            msg('Invalid date entered.');
            stopRunning();
        }
    };
}

// Configures the UI
document.addEventListener('DOMContentLoaded', () => {
    // First, check for Shiftboard login
    // If already logged in, remove prompt to Login
    var details = {name: 'SB2Session', url: 'https://www.shiftboard.com'};
    chrome.cookies.get(details, function(cookie) {
        if (cookie != null) {
            document.getElementById('shiftboardLogin').outerHTML='';
        }
    });

    // Check if authorized with Drive
    // Will not show authorization if authorized
    showDriveAuthDetails(false);

    // Initalize buttons
    document.getElementById('export').addEventListener('click', exportClickAction(generateReport));

    document.getElementById('shiftboard').addEventListener('click', () => {
        doShiftboardLogin();
    });

    document.getElementById('driveAuthBtn').addEventListener('click', () => {
        showDriveAuthDetails(true);
    });

    document.getElementById('revokeAuth').addEventListener('click', () => {
        revokeDriveAuth();
    });

    document.getElementById('genLinks').addEventListener('click', exportClickAction(generateLinks));
});
