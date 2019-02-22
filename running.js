// Limits multiple clicks of 'Export' button
var running = false;

// Utility functions
function isRunning() {
    return running;
}

function stopRunning() {
    running = false;
    document.getElementById('loader').style.display = 'none';
}

function startRunning() {
    running = true;
    msg();
    document.getElementById('loader').style.display = 'block';
}
