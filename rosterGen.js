// Generates spreadsheet object for Sheets from raw data
function generateRosterSpreadsheet(reportData, tgtDate) {
    var matrix = dataToMatrix(reportData);
    var newMatrix = formatMatrix(matrix);
    return createUploadObject(newMatrix, tgtDate);
}

/* Returns a new matrix with the correct formatting.

Format:
* Header: Name, Role, Location, Shift, Date, Arrive, Leave, No Show, Notes
* Sorting of the rows: By Role, Location, and finally by Name
* Inject blank rows in-between major groups (CM, Ninja, Shift Leader, Volunteer)
* Give Ninja the correct Role (not Shift Leader) */
function formatMatrix(matrix) {
    var newMatrix = [];

    let MAX_COL = 5;

    // Create initial blank matrix
    for (var i = 0; i < matrix.length; i++) {
        var newRow = [];
        newMatrix.push(newRow);
        // 9 total columns
        for (var j = 0; j < MAX_COL; j++) {
            newRow.push('');
        }
    }

    // Copy all the data
    var index = 0;
    copyColumn(matrix, newMatrix, 5, index++); // Name
    copyColumn(matrix, newMatrix, 3, index++); // Role
    copyColumn(matrix, newMatrix, 2, index++); // Location
    copyColumn(matrix, newMatrix, 4, index++); // Shift
    copyColumn(matrix, newMatrix, 1, index++); // Date

    // Give proper Role for Ninjas
    for (var i = 0; i < matrix.length; i++) {
        let fullRole = matrix[i][0];
        if (fullRole.endsWith('Ninja')) {
            newMatrix[i][1] = 'Ninja';
        }
    }

    // Manual header overrides
    newMatrix[0][0] = 'Name';
    newMatrix[0].push('Arrive');
    newMatrix[0].push('Notes');

    // Temporarily remove the header
    let header = newMatrix.shift();

    // Sort the data: Role, Location, Name
    newMatrix.sort(function(rowOne, rowTwo) {
        let roleOne = rowOne[1];
        let roleTwo = rowTwo[1];

        if (roleOne === roleTwo) {
            let locOne = rowOne[2];
            let locTwo = rowTwo[2];

            if (locOne === locTwo) {
                let nameOne = rowOne[0];
                let nameTwo = rowTwo[0];
                return nameOne.localeCompare(nameTwo);
            }

            return locOne.localeCompare(locTwo);
        }

        return roleOne.localeCompare(roleTwo);
    });

    // Add header back in
    newMatrix.unshift(header);

    // Inject blank rows (at Role differences)
    var currRole = newMatrix[1][1];
    var indexToInsert = 2;
    while (indexToInsert < newMatrix.length) {
        let role = newMatrix[indexToInsert][1];
        if (role !== currRole) {
            currRole = role;
            newMatrix.splice(indexToInsert, 0, getBlankRow(MAX_COL));
        }
        indexToInsert++;
    }

    return newMatrix;
}

// Copies a column from a source to a destination
function copyColumn(src, dest, srcIndex, destIndex) {
    for (var i = 0; i < src.length; i++) {
        dest[i][destIndex] = src[i][srcIndex];
    }
}

// Creates a blank row of specified length
function getBlankRow(length) {
    var row = [];
    for (var i = 0; i < length; i++) {
        row.push('');
    }
    return row;
}

// Returns a Set of unique locations to create Sheets for
function getUniqueLocations(matrix) {
    var locs = [];

    var i = 1;
    // Skip pasts CMs
    while (matrix[i][2] !== '') {
        i++;
    }

    // Consider SL, Ninja, vol locations
    for (; i < matrix.length; i++) {
        let fullLoc = matrix[i][2];
        let loc = fullLoc.split(' - ')[0];
        
        if (loc !== '' && !locs.includes(loc)) {
            locs.push(loc);
        }
    }

    locs.sort();
    return locs;
}

// Returns the index of the first boundary in the full matrix.
// This is the first 'blank row' index.
function identifyFirstBoundary(matrix) {
    var i = 1;
    var role = matrix[i][1];
    while (role !== '') {
        role = matrix[++i][1];
    }
    return i;
}

// Returns a Google Sheet for the specified
// venue, including all CMs regardless
// CMs are before the startIndex
function getSheetForName(matrix, name, startIndex) {
    var sheet = getSheetTemplate();
    sheet.properties.title = name;
    var rowData = sheet.data[0].rowData;

    // Header
    rowData.push(rowToBoldedSheetRow(matrix, 0));

    // CMs
    for (var i = 1; i < startIndex; i++) {
        rowData.push(rowToSheetRow(matrix, i));
    }

    // Now, based on venue
    for (var i = startIndex; i < matrix.length; i++) {
        let fullLoc = matrix[i][2];
        let loc = fullLoc.split(' - ')[0];
        if (loc === name || loc === '') {
            rowData.push(rowToSheetRow(matrix, i));
        }
    }

    return sheet;
}

function getMasterSheet(matrix) {
    var sheet = getSheetTemplate();
    sheet.properties.title = 'Combined';
    var rowData = sheet.data[0].rowData;

    // Header
    rowData.push(rowToBoldedSheetRow(matrix, 0));

    for (var i = 1; i < matrix.length; i++) {
        rowData.push(rowToSheetRow(matrix, i));
    }

    return sheet;
}

// Returns a proper sheet row for the given index
function rowToSheetRow(matrix, rowIndex) {
    var result = {
        values: []
    };
    var vals = result.values;

    let row = matrix[rowIndex];
    for (var i = 0; i < row.length; i++) {
        var toAdd = {
            userEnteredValue: {
                stringValue: row[i]
            }
        };
        vals.push(toAdd);
    }

    return result;
}

// Returns a BOLDED sheet row for the given index
function rowToBoldedSheetRow(matrix, rowIndex) {
    var result = {
        values: []
    };
    var vals = result.values;

    let row = matrix[rowIndex];
    for (var i = 0; i < row.length; i++) {
        var toAdd = {
            userEnteredValue: {
                stringValue: row[i]
            },
            userEnteredFormat: {
                textFormat: {
                    bold: true
                }
            }
        };
        vals.push(toAdd);
    }

    return result;
}

// Get title for spreadsheet based on date
function getTitle(tgtDate) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let day = days[ tgtDate.getDay() ];
    let trueMonth = tgtDate.getMonth() + 1;
    return 'Rosters - ' + day + ' ' + trueMonth + '/' + tgtDate.getDate();
}

// Creates object in correct format for Google Sheets
function createUploadObject(matrix, tgtDate) {
    let locs = getUniqueLocations(matrix);
    let boundary = identifyFirstBoundary(matrix);

    var result = getSpreadsheet(getTitle(tgtDate));

    for (let loc of locs) {
        let sheet = getSheetForName(matrix, loc, boundary);
        result.sheets.push(sheet);
    }
    result.sheets.push(getMasterSheet(matrix));

    return result;
}
