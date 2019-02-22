// Limits multiple clicks of 'Export' button
var running = false;

// Utility functions
function isRunning() {
    return running;
}

function stopRunning() {
    running = false;
}

function startRunning() {
    running = true;
}
