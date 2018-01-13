// Moves the file into best possible destination folder
function moveFileIntoFolder(token, tgtDate, fileId) {
    findSXSWMaster(token, tgtDate, fileId);
}

// Path of folder for rosters: SXSW MASTER -> <year> -> Rosters -> Daily

// Finds the 'SXSW MASTER' folder
function findSXSWMaster(token, tgtDate, fileId) {
    findChildFolder(token, null, 'SXSW MASTER', function(master) {
        if (master !== null) {
            findYearFolder(token, master, tgtDate, fileId); 
        }
    });
}

// Finds the <year> folder
function findYearFolder(token, parent, tgtDate, fileId) {
    var year = tgtDate.getFullYear() + '';
    findChildFolder(token, parent, year, function(year) {
        if (year !== null) {
            findRostersFolder(token, year, fileId);
        } else {
            relocateFileToFolder(token, fileId, parent);
        }
    });
}

// Finds the Rosters folder
function findRostersFolder(token, parent, fileId) {
    findChildFolder(token, parent, 'Rosters', function(rosters) {
        if (rosters !== null) {
            findDailyFolder(token, rosters, fileId);
        } else {
            relocateFileToFolder(token, fileId, parent);
        }
    });
}

// Finds the Daily folder
function findDailyFolder(token, parent, fileId) {
    findChildFolder(token, parent, 'Daily', function(daily) {
        if (daily !== null) {
            relocateFileToFolder(token, fileId, daily);
        } else {
            relocateFileToFolder(token, fileId, parent);
        }
    });
}

// Moves the file into the given folder.
// Removes current parent reference and adds a new parent
function relocateFileToFolder(token, fileId, folderId) {
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
                            uploadFinished(link);
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
