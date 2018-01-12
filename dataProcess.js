// Generates spreadsheet object for Sheets from raw data
function generateSpreadsheet(reportData) {
	var matrix = dataToMatrix(reportData);
	var newMatrix = formatMatrix(matrix);
	return createUploadObject(newMatrix);
}

// Parses the data into a 2D array, ignoring extra data.
function dataToMatrix(reportData) {
	var matrix = []
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
		var newRow = []
		matrix.push(newRow)
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

/* Returns a new matrix with the correct formatting.

Format:
* Header: Name, Role, Location, Shift, Date, Arrive, Leave, No Show, Notes
* Sorting of the rows: By Role, Location, and finally by Name
* Inject blank rows in-between major groups (CM, Ninja, Shift Leader, Volunteer)
* Give Ninja the correct Role (not Shift Leader) */
function formatMatrix(matrix) {
	var newMatrix = []

	let MAX_COL = 5;

	// Create initial blank matrix
	for (var i = 0; i < matrix.length; i++) {
		var newRow = []
		newMatrix.push(newRow)
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
	newMatrix[0].push('Depart');
	newMatrix[0].push('No Show');
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
	var locs = new Set();

	var i = 1;
	var role = matrix[i][1];
	while (role !== 'Shift Leader') {
		role = matrix[++i][1];
	}

	// Now on the Shift Leaders
	while (role !== '') {
		let fullLoc = matrix[i][2];
		let loc = fullLoc.split(' - ')[0];
		locs.add(loc);
		role = matrix[++i][1];
	}

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

function getSheetTemplate() {
	let sheet = {
		properties: {
			title: ''
		},
		data: [
			{
				startRow: 0,
				startColumn: 0,
				rowData: []
			}
		]
	};
	return sheet;
}

// Returns a Google Sheet for the specified
// venue, including all CMs regardless
// CMs are before the startIndex
function getSheetForName(matrix, name, startIndex) {
	var sheet = getSheetTemplate();
	sheet.properties.title = name;
	var rowData = sheet.data[0].rowData;

	// CMs
	for (var i = 0; i < startIndex; i++) {
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
	sheet.properties.title = 'Master';
	var rowData = sheet.data[0].rowData;

	for (var i = 0; i < matrix.length; i++) {
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

// Creates object in correct format for Google Sheets
function createUploadObject(matrix) {
	let locs = getUniqueLocations(matrix);
	let boundary = identifyFirstBoundary(matrix);

	var result = { 
		properties: {
			title: "TODO: Implement this"
		},
		sheets: [] 
	};

	for (let loc of locs) {
		let sheet = getSheetForName(matrix, loc, boundary);
		result.sheets.push(sheet);
	}
	result.sheets.push(getMasterSheet(matrix));

	console.log(result);
	return result;
}
