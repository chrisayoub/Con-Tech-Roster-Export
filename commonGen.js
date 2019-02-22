// Parses the data into a 2D array, ignoring extra data.
function dataToMatrix(reportData) {
    var matrix = [];
    var rows = reportData.split('\n');

    let NUM_COLS = 6;

    // For the header
    var header = rows[0].split('\t');
    header.splice(NUM_COLS);
    matrix.push(header);

    // Exclude last blank row
    for (var i = 1; i < rows.length - 1; i++) {
        let row = rows[i];
        let rowSplit = row.split('\t');
        var newRow = [];
        matrix.push(newRow);
        // Stops early, ignores unneeded cols
        for (var j = 0; j < rowSplit.length && j < NUM_COLS; j++) {
            // Removes the " characters
            let col = rowSplit[j];
            var newCol = col.substring(1, col.length - 1);
            newRow.push(newCol)
        }
    }
    return matrix;
}

// JSON object template for Sheet
function getSheetTemplate() {
    return {
        properties: {
            title: '',
            gridProperties: {
                frozenRowCount: 1
            }
        },
        data: [
            {
                startRow: 0,
                startColumn: 0,
                rowData: []
            }
        ]
    };
}

// JSON object template for Spreadsheet
function getSpreadsheet(title) {
    return {
        properties: {
            title: title
        },
        sheets: []
    };
}
