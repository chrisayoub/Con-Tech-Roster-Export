function getReportCsv(tgtDate) {
    var url = getReportUrl(tgtDate);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            console.log(xhr.responseText);
            var data = xhr.responseText;
        }        
    };
    xhr.open("GET", url, true);
    xhr.send();
}

function getReportUrl(tgtDate) {
    return 'https://www.shiftboard.com/servola/reporting/report.cgi?' + 
            'type=coverage&ss=298255&deleted_teams=2&covered=1&' + 
            'format=comma_delimit&include=selected_fields&download=Download&' + 
            'start_date=' + tgtDate + '&'
            'end_date=' + tgtDate
}

function doShiftboardLogin() {
    chrome.tabs.create({url: 'https://www.shiftboard.com/sxsw/'}, null);
}

function getDateStr(date) {
    var year = date.getFullYear();

    var month = '' + (date.getMonth() + 1);
    month = month.padStart(2, '0');

    var day = '' + date.getDate();
    day = day.padStart(2, '0');

    return year + month + day;
}

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

    // TODO: check for Google Drive login

    // Initalize buttons
    var button = document.getElementById('btn');
    button.addEventListener('click', () => {
        // Check for a valid date
        var date = $('#datepicker').datepicker( "getDate" );
        if (date != null) {
            // Get the report data
            var dateStr = getDateStr(date);
            getReportCsv(dateStr);
        }
    });

    var shiftboard = document.getElementById('shiftboard');
    shiftboard.addEventListener('click', () => {
      doShiftboardLogin();
    });

    // Initalize date picker
    $('#datepicker').datepicker();
});
