// Limits multiple clicks of 'Export' button
var running = false;

// Generates the report and formats it
function generateReport(tgtDate) {
    var dateStr = getDateStr(tgtDate);
    var url = getReportUrl(dateStr);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let data = xhr.responseText;
                // Check for present data
                if (data.split('\n').length < 3) {
                    msg('No data to export for this date.');
                    running = false;
                } else {
                    let objToUpload = generateSpreadsheet(data, tgtDate);
                    uploadSheet(objToUpload, tgtDate);
                }       
            } else {
                msg('Error: Could not get Shiftboard report.');
                console.log(xhr.responseText);
                running = false;
            }
        }        
    };
    xhr.open('GET', url, true);
    xhr.send();
}

// Uploads the Links spreadsheet data to Drive
function uploadLinkSheet(spreadsheet, tgtDate) {
    getDriveToken(false, function(token) {
        var url = 'https://sheets.googleapis.com/v4/spreadsheets';
        url += '?access_token=' + token;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    let result = JSON.parse(xhr.responseText);

                    // Auto-resize cols
                    resizeCols(result, token);

                    // Try to move into correct folder
                    var id = result.spreadsheetId;
                    moveLinkFileIntoFolder(token, tgtDate, id);
                    
                } else {
                    msg('Error: Could not upload Google Sheet.');
                    console.log(xhr.responseText);
                    running = false;
                }
            }        
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(spreadsheet));
    });
}

// Uploads the spreadsheet data to Drive
function uploadSheet(spreadsheet, tgtDate) {
    getDriveToken(false, function(token) {
        var url = 'https://sheets.googleapis.com/v4/spreadsheets';
        url += '?access_token=' + token;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    let result = JSON.parse(xhr.responseText);

                    // Auto-resize cols
                    resizeCols(result, token);

                    // Try to move into correct folder
                    var id = result.spreadsheetId;
                    moveFileIntoFolder(token, tgtDate, id);
                } else {
                    msg('Error: Could not upload Google Sheet.');
                    console.log(xhr.responseText);
                    running = false;
                }
            }        
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(spreadsheet));
    });
}

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
    running = false;
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
    running = false;
}

// Resizes cols to be automatic resize after data uploaded
function resizeCols(spreadsheetInfo, token) {
    var url = 'https://sheets.googleapis.com/v4/spreadsheets/';
    url += spreadsheetInfo.spreadsheetId + ':batchUpdate';
    url += '?access_token=' + token;

    var payload = {
        requests: []
    };

    // Auto-resize for first five cols
    let sheets = spreadsheetInfo.sheets;
    for (let sheet of sheets) {
        let sheetId = sheet.properties.sheetId;
        let request = {
            autoResizeDimensions: {
                dimensions: {
                    sheetId: sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 4
                }
            }
        };
        payload.requests.push(request);
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status !== 200) {
                    msg('Error: Could not format Google Sheet.');
                    console.log(xhr.responseText);
                }
            }        
        };
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(payload));
}

// Report URL for data export from Shiftboard
function getReportUrl(tgtDate) {
    return 'https://www.shiftboard.com/servola/reporting/report.cgi?' + 
            'type=coverage&ss=298255&deleted_teams=2&covered=1&' + 
            'format=tab_delimited&include=selected_fields&download=Download&' + 
            'start_date=' + tgtDate + '&' +
            'end_date=' + tgtDate
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

function msg(m) {
    if (msg === null) {
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
        if (running) {
            console.log('Export is already running!');
            return;
        }
        running = true;

        // Reset link field
        document.getElementById('link').innerHTML = '';
        // Check for a valid date
        var date = getDate();
        if (date != null) {
            // Generate the report
            callback(date);
        } else {
            msg('Invalid date entered.');
            running = false;
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

    document.getElementById('genLinks').addEventListener('click', exportClickAction(generateLinksForDate));
});
