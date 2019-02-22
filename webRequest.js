// Report URL for data export from Shiftboard
function getReportUrl(tgtDate) {
    return 'https://www.shiftboard.com/servola/reporting/report.cgi?' +
        'type=coverage&ss=298255&deleted_teams=2&covered=1&' +
        'format=tab_delimited&include=selected_fields&download=Download&' +
        'start_date=' + tgtDate + '&' +
        'end_date=' + tgtDate
}

// Generates the report and formats it
function generateReport(tgtDate) {
    retrieveShiftboardData(new function(data) {
        let objToUpload = generateRosterSpreadsheet(data, tgtDate);
        uploadSheet(objToUpload, tgtDate);
    });
}

// Starts the process on generating the links for a specific date
function generateLinks(tgtDate) {
    retrieveShiftboardData(new function(data) {
        let objToUpload = generateLinkSpreadsheet(data, tgtDate);
        // Now, upload the object
        uploadLinkSheet(uploadObject, tgtDate);
        // Done!
        running = false;
    });
}

// Common function to get Shiftboard data, do a callback when got
function retrieveShiftboardData(callback) {
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
                    stopRunning();
                } else {
                    callback(data);
                }
            } else {
                msg('Error: Could not get Shiftboard report.');
                console.log(xhr.responseText);
                stopRunning();
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
                    stopRunning();
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
                    stopRunning();
                }
            }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(spreadsheet));
    });
}

// Common function to upload sheet to Drive
// Callback function useful for moving into folder
function uploadSheet(spreadsheet, tgtDate, callback) {
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
                    stopRunning();
                }
            }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(spreadsheet));
    });
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
