function generateSpreadsheet(reportData) {
	var matrix = dataToMatrix(reportData);
	console.log(matrix);
}

// Parses the data into a 2D array, ignoring extra data.
function dataToMatrix(reportData) {
	var matrix = []
	for (let row of reportData.split('\n')) {
		let rowSplit = row.split('\t');
		var newRow = []
		matrix.push(newRow)
		// Stops early, removes unneeded cols
		for (var i = 0; i < rowSplit.length && i < 7; i++) {
			// Removes the " characters
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
* Ignore rows with empty First Name cell (index 6)  */
function formatMatrix(matrix) {

}

