// Moves the file into best possible destination folder

let YR_PLACE = '<yr>';
let BASE_PATH = 'SXSW MASTER,' + YR_PLACE + ',';

// Replace placeholder for actual year value
function replaceYear(path, tgtDate) {
    var year = tgtDate.getFullYear() + '';
    for (var i = 0; i < path.length; i++) {
        if (path[i] === YR_PLACE) {
            path[i] = year;
        }
    }
    return path;
}

// Relocation of roster sheet
function moveRosterIntoFolder(token, tgtDate, fileId) {
    let ROSTER_PATH =  BASE_PATH + 'Rosters'.split(',');
    moveFileIntoFolder(token, tgtDate, fileId, ROSTER_PATH);
}

// Relocation of link sheet
function moveLinksIntoFolder(token, tgtDate, fileId) {
    let LINK_PATH = BASE_PATH + 'Vol Scoring Links'.split(',');
    moveFileIntoFolder(token, tgtDate, fileId, LINK_PATH);
}

// Common function for moving file into folder based on path
function moveFileIntoFolder(token, tgtDate, fileId, path) {
    replaceYear(path, tgtDate); // Resolve placeholder value




}

function recursivePathRelocation(token, fileId, path, index) {
    let prevTgtName;
    let currTgtName = path[index];
    if (index > 0) {
        prevTgtName = path[index - 1];
    }

    findChildFolder(token, prevTgtName, currTgtName, function(result) {
        // if (year !== null) {
        //     findRostersFolder(token, year, fileId);
        // } else {
        //     relocateFileToFolder(token, fileId, parent);
        // }

        if (result !== null) {
            // Found the resulting folder! Try and find the next one
            recursivePathRelocation(token, fileId, path, index + 1);
        } else {
            // Didn't work, relocate into parent
        }
    });
}

// function moveFileIntoFolder(token, tgtDate, fileId) {
//     findSXSWMaster(token, tgtDate, fileId);
// }

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
