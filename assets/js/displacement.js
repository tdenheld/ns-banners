// Maximum distance for xy displacement offset
var DRIFT_RANGE = 10;

// Create/cache canvases and contexts for source image, 
// displacement map, and output
var cOutput = document.getElementById('output'),
    ctxOutput = cOutput.getContext('2d'),

    cSource = document.createElement('canvas'),
    ctxSource = cSource.getContext('2d'),

    cMap = document.createElement('canvas'),
    ctxMap = cMap.getContext('2d'),

    images = document.querySelectorAll('#images img');

// Ensure all canvases are the same size
var cw = cSource.width = cMap.width = cOutput.width;
var ch = cSource.height = cMap.height = cOutput.height;

// Refs for the image data
var sourceData, mapData,
    outputData = ctxOutput.createImageData(cw, ch);

function update() {
    // Calculate the xy drift based on the current time.
    // y drift is half-speed
    // TODO: make interactive (mouse, gyro, etc)
    var t = 0.002 * Date.now(),
        dx = Math.sin(t) * DRIFT_RANGE,
        dy = Math.cos(t * 0.5) * DRIFT_RANGE;

    // Iterate the xy grid
    // TODO: optimize this!
    for (var y = 0; y < ch; y++) {
        for (var x = 0; x < cw; x++) {

            // Get the greyscale value from the displacement map as a value between 0 and 1
            // 0 = black (farthest), 1 = white (nearest)
            // Higher values will be more displaced
            var pix = y * cw + x,
                arrayPos = pix * 4,
                depth = mapData[arrayPos] / 255;

            // Use the greyscale value as a percentage of our current drift,
            // and calculate an xy pixel offset based on that
            var ofs_x = Math.round(x + (dx * depth)),
                ofs_y = Math.round(y + (dy * depth));

            // Clamp the offset to the canvas dimensions
            if (ofs_x < 0) ofs_x = 0;
            if (ofs_x > cw - 1) ofs_x = cw - 1;
            if (ofs_y < 0) ofs_y = 0;
            if (ofs_y > ch - 1) ofs_y = ch - 1;

            // Get the colour from the source image at the offset xy position,
            // and transfer it to our output at the original xy position
            var targetPix = ofs_y * cw + ofs_x,
                targetPos = targetPix * 4;
            outputData.data[arrayPos] = sourceData[targetPos];
            outputData.data[arrayPos + 1] = sourceData[targetPos + 1];
            outputData.data[arrayPos + 2] = sourceData[targetPos + 2];
            outputData.data[arrayPos + 3] = sourceData[targetPos + 3];
        }
    }
}

function render() {
    ctxOutput.putImageData(outputData, 0, 0);
}

function loop() {
    requestAnimationFrame(loop);
    update();
    render();
}

function init() {
    // Write our source image and displacement map to in-memory
    // canvases and cache the data (it never gets directly manipulated)

    var sourceImg = images[0],
        mapImg = images[1];

    ctxSource.drawImage(sourceImg, 0, 0);
    sourceData = ctxSource.getImageData(0, 0, cw, ch).data;

    ctxMap.drawImage(mapImg, 0, 0);
    mapData = ctxMap.getImageData(0, 0, cw, ch).data;

    // Kick off the update-render loop
    loop();
}

window.addEventListener('load', () => {
    init();
});