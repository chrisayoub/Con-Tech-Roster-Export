// Report URL for data export from Shiftboard
function getReportUrl(tgtDate) {
    return 'https://www.shiftboard.com/servola/reporting/report.cgi?' +
        'type=coverage&ss=298255&deleted_teams=2&covered=1&' +
        'format=tab_delimited&include=selected_fields&download=Download&' +
        'start_date=' + tgtDate + '&' +
        'end_date=' + tgtDate
}

// Common function to get Shiftboard data, do a callback when got
function retrieveShiftboardData(tgtDate, callback) {
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

// Common function to upload sheet to Drive
// Executes the callback function stored in the global variable 'relocateFunction'
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
                    relocateFunction(token, tgtDate, id);
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

// Moves the file into the given folder.
// Removes current parent reference and adds a new parent
// Executes the callback function stored in the global variable 'finishFunction'
function relocateFileToFolder(token, fileId, folderId) {
    // Do nothing if null params
    if (token === null || fileId === null || folderId === null) {
        return;
    }

    var url = 'https://www.googleapis.com/drive/v2/files/';
    url += fileId;
    url += '?access_token=' + token;

    // Gets current file info, including parent
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // Remove old parent and add new parent
                var result = JSON.parse(xhr.responseText);
                var currentParent = result.parents[0].id;

                var urlUpdate = url;
                urlUpdate += "&removeParents=" + currentParent;
                urlUpdate += "&addParents=" + folderId;

                var xhrUpdate = new XMLHttpRequest();
                xhrUpdate.onreadystatechange = function() {
                    if (xhrUpdate.readyState === XMLHttpRequest.DONE) {
                        if (xhrUpdate.status === 200) {
                            var finalResult = JSON.parse(xhrUpdate.responseText);
                            var link = finalResult.alternateLink;
                            console.log(link);
                            // Finish function, report result
                            finishUploadFunction(link);
                        } else {
                            console.log(xhrUpdate.responseText);
                        }
                    }
                };
                xhrUpdate.open('PUT', urlUpdate, true);
                xhrUpdate.send();
            } else {
                console.log(xhr.responseText);
            }
        }
    };
    xhr.open('GET', url, true);
    xhr.send();
}

// Callsback the ID of the child folder, null
// if not present.
function findChildFolder(token, parent, childName, callback) {
    var url = 'https://www.googleapis.com/drive/v2/files';
    url += '?access_token=' + token + '&';
    url += "q=title%3D'" + childName + "'";
    if (parent !== null) {
        url += "+and+'" + parent + "'+in+parents";
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let result = JSON.parse(xhr.responseText);
                if (result.items.length === 0) {
                    console.log(xhr.responseText);
                    callback(null);
                } else {
                    let id = result.items[0].id;
                    callback(id);
                }
            } else {
                console.log(xhr.responseText);
                callback(null);
            }
        }
    };
    xhr.open('GET', url, true);
    xhr.send();
}
