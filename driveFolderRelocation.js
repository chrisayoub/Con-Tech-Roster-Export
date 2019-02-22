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
    let ROSTER_PATH = BASE_PATH + 'Rosters';
    moveFileIntoFolder(token, tgtDate, fileId, ROSTER_PATH);
}

// Relocation of link sheet
function moveLinksIntoFolder(token, tgtDate, fileId) {
    let LINK_PATH = BASE_PATH + 'Vol Scoring Links';
    moveFileIntoFolder(token, tgtDate, fileId, LINK_PATH);
}

// Common function for moving file into folder based on path
function moveFileIntoFolder(token, tgtDate, fileId, path) {
    // Split path into array
    path = path.split(',');
    // Resolve placeholder value for year
    replaceYear(path, tgtDate);
    // Kick off recursion to relocate!
    recursivePathRelocation(token, fileId, path, 0, null);
}

// Recursive function to place file in folder as deep as possible
function recursivePathRelocation(token, fileId, path, index, parentFolderId) {
    // Base case: end of path, will simply relocate into parentFolderId
    if (index >= path.length) {
        relocateFileToFolder(token, fileId, parentFolderId);
        return;
    }

    let currTgtName = path[index];

    findChildFolder(token, parentFolderId, currTgtName, function(result) {
        if (result !== null) {
            // Found the resulting folder! Try and find the next one
            recursivePathRelocation(token, fileId, path, index + 1, result);
        } else {
            // Did not find the next child folder in the path
            // Will relocate into the parent folder id
            relocateFileToFolder(token, fileId, parentFolderId);
        }
    });
}
