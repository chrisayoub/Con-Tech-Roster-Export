// Generates spreadsheet object for Sheets from raw data
function generateLinkSpreadsheet(reportData, tgtDate) {
    var matrix = dataToMatrix(reportData);
    var dict = getLinksFromMatrix(matrix, tgtDate);
    var sheetData = generateArrayFromDict(dict);
    return createLinkSheetUploadObject(sheetData, tgtDate);
}

// Returns the location name for the form
function mapLoc(location) {
    var locSplitDash = location.split(' - ')[0];
    var locSplit = location.split(' ')[0];
    // ACC - Zone A -> ACC
    // Courtyard Marriott Downtown -> Courtyard
    // Driskill Hotel -> Driskill
    // Fairmont - Zone A -> Fairmont
    // Four Seasons -> Four Seasons
    // Hilton - Zone A -> Hilton
    // JW Marriott - Zone A -> JW Marriott
    // Palmer Events Center -> Palmer
    // Westin -> Westin

    if (locSplitDash === 'ACC') {
        return 'ACC';
    } else if (locSplit === 'Courtyard') {
        return 'Courtyard'
    } else if (locSplit === 'Driskill') {
        return 'Driskill';
    } else if (locSplitDash === 'Fairmont') {
        return 'Fairmont';
    } else if (locSplitDash === 'Hilton') {
        return 'Hilton';
    } else if (locSplitDash === 'JW Marriott') {
        return 'JW Marriott';
    } else if (locSplit === 'Palmer') {
        return 'Palmer';
    }
    return location; // Westin, Four Seasons
}

// Get list of links from matrix
function getLinksFromMatrix(matrix, date) {
    var dict = {};

    for (var i = 1; i < matrix.length; i++) {
        var line = matrix[i];

        // Name
        var fullName = line[5];
        
        // Crew
        var tempCrew = line[0];
        var crew = '';
        if (tempCrew.endsWith('Lead')) {
            crew = 'Shift+Leader';
        } else if (tempCrew.endsWith('Ninja')) {
            crew = 'Ninja';
        } else {
           continue;
        }

        // Location
        var location = mapLoc(line[2]);

        // Date
        var day = date.getDate();
        var monthIndex = date.getMonth() + 1;
        var year = date.getFullYear();

        var dateStr = monthIndex + '/' + day + '/' + year;

        // Now, create link if name not already in Set
        if (!(fullName in dict)) {
            // Generate link!
            dict[fullName] = getLinkWithParams(fullName, crew, location, dateStr);
        }
    }
    // Return result
    return dict;
}

// Returns formatted link based on params
function getLinkWithParams(fullName, crew, location, dateStr) {
    var result = "";
    result += "https://docs.google.com/forms/d/e/1FAIpQLSdrjMtCx2BNfufLthp5u3parOey8anxGktU0SsOcsl38vXhZg/viewform?usp=pp_url&";

    // Name
    result += "entry.1000000=";
    result += fullName.replace(' ', '+');
    // Role
    result += "&entry.441130460=";
    result += crew.replace(' ', '+');
    // Date
    result += "&entry.1000008=";
    result += dateStr;
    // Venue
    result += "&entry.1000004=";
    result += location.replace(' ', '+');

    return result;
}

// Generates actual sheet base data from dictionary
function generateArrayFromDict(dict) {
    var names = [];
    for (key in dict) {
        names.push(key);
    }
    names.sort();
    
    var result = [];
    result.push(["Name", "Link"]);
    for (i in names) {
        var name = names[i]; 
        result.push([name, dict[name]]);
    } 
    return result;
}

// Get title for spreadsheet based on date
function getLinkSheetTitle(tgtDate) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let day = days[ tgtDate.getDay() ];
    let trueMonth = tgtDate.getMonth() + 1;
    return 'Vol Scoring Links - ' + day + ' ' + trueMonth + '/' + tgtDate.getDate();
}

// Transforms matrix data into Sheet object
function getLinkSheet(matrix) {
    var sheet = getSheetTemplate();
    sheet.properties.title = null;
    var rowData = sheet.data[0].rowData;

    // Header
    rowData.push(rowToBoldedSheetRow(matrix, 0));

    for (var i = 1; i < matrix.length; i++) {
        rowData.push(rowToSheetRow(matrix, i));
    }

    return sheet;
}

// Creates object in correct format for Google Sheets
function createLinkSheetUploadObject(sheetData, tgtDate) {
    var result = getSpreadsheet(getLinkSheetTitle(tgtDate));
    result.sheets.push(getLinkSheet(sheetData));
    return result;
}
