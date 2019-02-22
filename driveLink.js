// Moves the VolScoreLink file into best possible destination folder
function moveLinkFileIntoFolder(token, tgtDate, fileId) {
    findSXSWMasterVolScore(token, tgtDate, fileId);
}

// Path of folder for rosters: SXSW MASTER -> <year> -> Rosters -> Daily

// Finds the 'SXSW MASTER' folder
function findSXSWMasterVolScore(token, tgtDate, fileId) {
    findChildFolder(token, null, 'SXSW MASTER', function(master) {
        if (master !== null) {
            findYearFolderVolScore(token, master, tgtDate, fileId); 
        }
    });
}

// Finds the <year> folder
function findYearFolderVolScore(token, parent, tgtDate, fileId) {
    var year = tgtDate.getFullYear() + '';
    findChildFolder(token, parent, year, function(year) {
        if (year !== null) {
            findVolScoreFolder(token, year, fileId);
        } else {
            relocateVolScoreFileToFolder(token, fileId, parent);
        }
    });
}

// Finds the Vol Scoring Links folder
function findVolScoreFolder(token, parent, fileId) {
    findChildFolder(token, parent, 'Vol Scoring Links', function(folder) {
        if (folder !== null) {
            relocateVolScoreFileToFolder(token, fileId, folder);
        } else {
            relocateVolScoreFileToFolder(token, fileId, parent);
        }
    });
}

// Moves the file into the given folder.
// Removes current parent reference and adds a new parent
function relocateVolScoreFileToFolder(token, fileId, folderId) {
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
                        
                            uploadFinishedVolScore(link);
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