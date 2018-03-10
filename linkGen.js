
// Get list of links from matrix
function getLinksFromMatrix(matrix, tgtDate) {
    for (var i = 1; i < matrix.length; i++) {
        var line = matrix[i];

        // Name
        var nameSplit = line[5].split(' ');
        var firstName = nameSplit[0];
        var lastName = nameSplit[nameSplit.length - 1];
        var fullName = firstName + '+' + lastName;
        
        // Crew
        var tempCrew = line[0];
        var crew = '';
        if (tempCrew.endsWith('Leader')) {
            crew = 'Shift+Leader';
        } else if (tempCrew.endsWith('Ninja')) {
            crew = 'Ninja';
        }

        // Location

        // Date

    }
}

// Starts the process on generating the links for a specific date
function generateLinksForDate(tgtDate) {
    var dateStr = getDateStr(tgtDate);
    var url = getReportUrl(dateStr);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let data = xhr.responseText;
                // Check for present data
                if (data.split('\n').length < 3) {
                    document.getElementById('error').innerHTML = 'No data to export for this date.';
                    running = false;
                } else {
                    // let objToUpload = generateSpreadsheet(data, tgtDate);
                    var matrix = dataToMatrix(data);
                    // Indexes of matrix 0-indexed: Crew, Date, Location, Role, Shift, Name

                    // For Name: Split by spaces, first = 0, last = last index

                    // Role: use crew, if ends with Ninja or Leader gets result

                    // Date: do based on passed-in tgtDate

                    // Location: split by ' - ', take index 0, then map correctly
                    console.log(matrix);
                    // uploadSheet(objToUpload, tgtDate);
                }       
            } else {
                document.getElementById('error').innerHTML = 'Error: Could not get Shiftboard report.';
                console.log(xhr.responseText);
                running = false;
            }
        }        
    };
    xhr.open('GET', url, true);
    xhr.send();
}