function generateSpreadsheet(reportData) {
	var matrix = dataToMatrix(reportData);
	var newMatrix = formatMatrix(matrix);
	console.log(newMatrix);
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

	// Create initial blank matrix
	for (var i = 0; i < matrix.length; i++) {
		var newRow = []
		newMatrix.push(newRow)
		// 9 total columns
		for (var j = 0; j < 9; j++) {
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
	newMatrix[0][5] = 'Arrive';
	newMatrix[0][6] = 'Depart';
	newMatrix[0][7] = 'No Show';
	newMatrix[0][8] = 'Notes';

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

	// Inject blank rows

	return newMatrix;
}

function copyColumn(src, dest, srcIndex, destIndex) {
	for (var i = 0; i < src.length; i++) {
		dest[i][destIndex] = src[i][srcIndex];
	}
}
