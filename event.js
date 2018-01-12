function getReportCsv(tgtDate) {
    var dateStr = getDateStr(tgtDate);
    var url = getReportUrl(dateStr);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let data = xhr.responseText;
                let objToUpload = generateSpreadsheet(data, tgtDate);
                uploadSheet(objToUpload);
            } else {
                document.getElementById('error').innerHTML = 'Error: Could not get Shiftboard report.';
                console.log(xhr.responseText);
            }
        }        
    };
    xhr.open('GET', url, true);
    xhr.send();
}

function uploadSheet(spreadsheet) {
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
                    // Done!
                    let link = result.spreadsheetUrl;
                    var msg = 'Success! Link: <a href="' + link + '">' + link + '</a>';
                    document.getElementById('error').innerHTML = msg;
                } else {
                    document.getElementById('error').innerHTML = 'Error: Could not upload Google Sheet.';
                    console.log(xhr.responseText);
                }
            }        
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(spreadsheet));
    });
}

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
                    document.getElementById('error').innerHTML = 'Error: Could not format Google Sheet.';
                    console.log(xhr.responseText);
                }
            }        
        };
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(payload));
}

function getReportUrl(tgtDate) {
    return 'https://www.shiftboard.com/servola/reporting/report.cgi?' + 
            'type=coverage&ss=298255&deleted_teams=2&covered=1&' + 
            'format=tab_delimited&include=selected_fields&download=Download&' + 
            'start_date=' + tgtDate + '&' +
            'end_date=' + tgtDate
}

function doShiftboardLogin() {
    chrome.tabs.create({url: 'https://www.shiftboard.com/sxsw/'}, null);
}

function getDriveToken(interactive, callbackFunc) {
    chrome.identity.getAuthToken({ 'interactive': interactive }, callbackFunc);
}

function getDateStr(date) {
    var year = date.getFullYear();

    var month = '' + (date.getMonth() + 1);
    month = month.padStart(2, '0');

    var day = '' + date.getDate();
    day = day.padStart(2, '0');

    return year + month + day;
}

function showDriveAuthDetails(interactive) {
    getDriveToken(interactive, function(token) {
        if (token != null) {
            var nameToSet = document.getElementById('accountName');
            chrome.identity.getProfileUserInfo(function (userInfo) {
                nameToSet.innerHTML = userInfo.email;
                // Show the account info
                // document.getElementById('revokeAuth').style.display = 'inline';
                document.getElementById('driveAccountInfo').style.display = null;
            });
        } else {

        }
    });
}

// function revokeDriveAuth() {
//     getDriveToken(false, function(token) {
//         if (token != null) {
//             console.log('token')
//             console.log(token)
//             chrome.identity.removeCachedAuthToken({'token' : token}, function() {
//                 // Hide UI elements
//                 document.getElementById('revokeAuth').style.display = 'none';
//                 document.getElementById('driveAccountInfo').style.display = 'none';
//             });
//         }
//     });
// }

// Sets up the UI buttons
document.addEventListener('DOMContentLoaded', () => {

    // First, check for Shiftboard login
    // If already logged in, remove prompt to Login
    var details = {name: 'SB2Session', url: 'https://www.shiftboard.com'}
    chrome.cookies.get(details, function(cookie) {
        if (cookie != null) {
            document.getElementById('shiftboardLogin').outerHTML='';
        }
    });

    // Check if authorized with Drive
    // Will not show authorization if authorized
    showDriveAuthDetails(false);

    // Initalize buttons
    document.getElementById('export').addEventListener('click', () => {
        // Check for a valid date
        var date = $('#datepicker').datepicker( "getDate" );
        if (date != null) {
            // Get the report data
            getReportCsv(date);
        }
    });

    document.getElementById('shiftboard').addEventListener('click', () => {
        doShiftboardLogin();
    });

    document.getElementById('driveAuthBtn').addEventListener('click', () => {
        showDriveAuthDetails(true);
    });

    // document.getElementById('revokeAuth').addEventListener('click', () => {
    //     revokeDriveAuth();
    // });

    // Initalize date picker
    $('#datepicker').datepicker();
});
