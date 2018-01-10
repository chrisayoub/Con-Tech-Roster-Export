function getReportCsv(tgtDate) {
    var url = getReportUrl(tgtDate);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            var data = xhr.responseText;
            generateSpreadsheet(data);
        }        
    };
    xhr.open("GET", url, true);
    xhr.send();
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
            var dateStr = getDateStr(date);
            getReportCsv(dateStr);
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
