var wd = {
        /* Variables */
    colorNames: [
            /* Basic colors */
        'red', 'orange', 'yellow', 'seagreen', 'blue', 'gray', 'pink',
            /* Extended colors */
        'springgreen', 'lightblue', 'darkviolet', 'darkgreen', 'lightgray',
    ],
    tubes:                             [],
    tubesRef:                          [],
    sourceTube:                        null,
    colorCount:                        6,
    pickedColor:                       null,
    tryCount:                          0,
    storedMoves:                       null,
    victoryInterval:                   null,
    victoryIncrement:                  0,

        /* Procedures */
    initialize: function() {
        wd.storedMoves                 = [];
        wd.tryCount                    = 1;
            /* Cycle color count from 7 to 12 */
        wd.colorCount                  = (wd.colorCount === 12)? 6: wd.colorCount + 1;
            /* This check ensures no tube contains more then two same consecutive colors */
        var isCorrectlyMixed           = false;
        while (!isCorrectlyMixed) {
                /* Build tubes array */
            var sortedColorTubes       = [];
            for (var colorIndex = 0; colorIndex < wd.colorCount; colorIndex += 1) {
                var color              = wd.colorNames[colorIndex];
                sortedColorTubes.push([color, color, color, color]);
            }
                /* Build and fill game tubes */
            wd.tubes                   = [];
            var array                  = new Uint8Array(wd.colorCount * 4);
            self.crypto.getRandomValues(array);
            for (var tubeIndex = 0; tubeIndex < wd.colorCount; tubeIndex += 1) {
                var tube               = [];
                for (var i = 0; i < 4; i += 1) {
                    var sortedTubeIndex = Math.floor((array[(tubeIndex * 4) + i] / 256) * sortedColorTubes.length);
                    var sortedColorTube = sortedColorTubes[sortedTubeIndex];
                    tube.push(sortedColorTube.pop());
                    if (sortedColorTube.length === 0) {
                        /* Remove empty tube from list */
                        sortedColorTubes.splice(sortedTubeIndex, 1);
                    } 
                }
                wd.tubes.push(tube);
            }
                /* Check consecutive colors: loop again when more than two */
            isCorrectlyMixed           = true;
            for (var tubeIndex = 0; tubeIndex < wd.colorCount; tubeIndex += 1) {
                var tube = wd.tubes[tubeIndex];
                if (((tube[0] === tube[1]) && (tube[0] === tube[2])) || ((tube[1] === tube[2]) && (tube[1] === tube[3]))) {
                    isCorrectlyMixed   = false;
                    break;
                }
            }            
        }
            /* Add two empty tubes */
        wd.tubes.push([]);
        wd.tubes.push([]);
            /* Reference initial tubes, in case we need to restart this game */
        wd.tubesRef = JSON.parse(JSON.stringify(wd.tubes));
        document.getElementById("backButton").style.display = "none";
            /* Display tubes */
        wd.paintTubes();
    },

    restart: function() {
        wd.tryCount                   += 1;
            /* Add a third empty tube after 5 tries */
        if (wd.tryCount === 6) wd.tubesRef.push([]);        
        wd.tubes                       = JSON.parse(JSON.stringify(wd.tubesRef));
        wd.storedMoves                 = [];
        wd.paintTubes();
    },
    removeCanvas: function(canvasIdPrefix) {
        var canvasTags                 = document.querySelectorAll('[id^="' + canvasIdPrefix + '"]');
        for (var i = (canvasTags.length-1); i >= 0; i -=1 ) {
            canvasTags[i].parentNode.removeChild(canvasTags[i]);
        }            
    },
    paintTubes: function() {
        document.getElementById("footerH2").innerHTML = (wd.colorCount + " colors, Try count: " + wd.tryCount);
        if (wd.tryCount > 5) document.getElementById("footerH2").innerHTML += " (with third empty tube)";
            /* Clear all canvases */
        wd.colorNames.forEach(colorName => wd.removeCanvas(colorName));
        wd.removeCanvas("tube_");
            /* Compare main area with required game area */
        var main                       = document.getElementsByTagName("main")[0];
        var mainProportion             = (main.clientWidth / main.clientHeight);
        var requiredWidthUnits         = wd.tubes.length + ((wd.tubes.length - 1) * 0.5);
        var requiredHeightUnits        = 4 + 0.5;
        var requiredProportion         = (requiredWidthUnits / requiredHeightUnits);
            /* Get drop size according to required screen proportion */
        var dropSize                   = Math.floor(main.clientHeight / (requiredHeightUnits + 2));
        if (requiredProportion > mainProportion) {
            dropSize                   = Math.floor(main.clientWidth / (requiredWidthUnits + 2));
        }
            /* Compute game area */
        var requiredWidth              = (requiredWidthUnits  * dropSize);
        var requiredHeight             = (requiredHeightUnits * dropSize);
            /* Set left and top margin (to center game) */
        var left                       = Math.floor(main.offsetLeft + ((main.clientWidth  - requiredWidth)  * 0.5));
        var top                        = Math.floor(main.offsetTop  + ((main.clientHeight - requiredHeight) * 0.5));
        var tubeVerticalMargin         = Math.floor(dropSize * 0.5);
        var tubeVerticalSpace          = Math.floor(tubeVerticalMargin / 10);
            /* Adjust reference canvas to required drop size */
        document.getElementById("hiddenColorCanvas").width  = dropSize;
        document.getElementById("hiddenColorCanvas").height = dropSize;
        document.getElementById("hiddenTubeCanvas").width   = (dropSize + 10);
        document.getElementById("hiddenTubeCanvas").height  = (dropSize * 4.5);
            /* Paint tubes and drops */
        for (var tubeIndex = 0; tubeIndex < wd.tubes.length; tubeIndex += 1) {
            var tubeCanvas             = document.getElementById("hiddenTubeCanvas").cloneNode(true);
            tubeCanvas.id              = "tube_" + tubeIndex;
            tubeCanvas.style.display   = "block";
            tubeCanvas.style.left      = (left - 5) + "px";
            tubeCanvas.style.top       = top  + "px";
            var ctx                    = tubeCanvas.getContext("2d");
            ctx.fillStyle              = "black";
            ctx.fillRect(0, 0, tubeCanvas.width, tubeCanvas.height);
            document.body.appendChild(tubeCanvas);
                /* Tube drops */
            var tube                   = wd.tubes[tubeIndex];
            var dropTop                = top + (dropSize * 4.5);
            for (var colorIndex = 0; colorIndex < tube.length; colorIndex += 1) {
                dropTop               -= (dropSize + tubeVerticalSpace);
                var currentColor     = tube[colorIndex];
                var colorCanvas        = document.getElementById("hiddenColorCanvas").cloneNode(true);
                colorCanvas.id         = currentColor + "_" + tubeIndex; 
                colorCanvas.style.display    = "block";
                colorCanvas.style.left       = left + "px";
                colorCanvas.style.top        = dropTop  + "px";
                var ctx2               = colorCanvas.getContext("2d");
                ctx2.fillStyle         = currentColor;
                ctx2.fillRect(0, 0, dropSize, dropSize);
                document.body.appendChild(colorCanvas);
            }
            left                      += (dropSize * 1.5);
        }
    },

        /* Click events */
    colorClick: function(event) {
        wd.selectColorAndTube(event.target.id);
    },
    tubeClick: function(event) {
        wd.validateColorMove(event.target.id.split("_")[1]);
    },
    
        /* Drag starts by picking a top color */
    dragstart: function(event) {
        event.preventDefault();
        wd.selectColorAndTube(event.target.id);
    },
        /* Drag over tube  */
    dragover: function(event) {
        event.preventDefault();
    },
        /* Drop to tube */
    drop: function(event) {
        event.preventDefault();
        wd.validateColorMove(event.target.id.split("_")[1]);
    },

        /* Common procedures */
    selectColorAndTube: function(colorId) {
        wd.pickedColor                 = colorId.split("_")[0];
        var tubeIndex                  = parseInt(colorId.split("_")[1]);
        wd.sourceTube                  = wd.tubes[tubeIndex];
    },
    validateColorMove: function(tubeIndex) {
        var targetTube                 = wd.tubes[tubeIndex];
            /* No move when source and target tubes are the same */
        if (targetTube === wd.sourceTube) { wd.resetMove(); return; }
            /* No move when target tube is full */
        if (targetTube.length === 4)      { wd.resetMove(); return; }
            /* Move when target tube is empty */
        if (targetTube.length === 0)      { wd.moveColor(targetTube); return; }
            /* Move when target tube top color is same as picked color */
        if ((targetTube[targetTube.length - 1] === wd.pickedColor)) wd.moveColor(targetTube);
            /* Else, no move */
    },
    resetMove: function() {
        wd.sourceTube                  = null;
        wd.pickedColor                 = null;
    },
    moveColor: function(targetTube) {
        var colorCount                 = 0;
        while ((wd.sourceTube.length > 0) && (wd.sourceTube[wd.sourceTube.length - 1] === wd.pickedColor) && (targetTube.length < 4)) {
            colorCount                += 1;
            targetTube.push(wd.sourceTube.pop());
        }
        wd.addMove(targetTube, wd.sourceTube, colorCount);
        wd.resetMove();
        wd.paintTubes();
        wd.evaluateScore();
    },

        /* Store moves for 'Back' button */
    addMove: function(targetTube, sourceTube, colorCount) {
        wd.storedMoves.reverse();
        wd.storedMoves.splice(4);
        wd.storedMoves.reverse();
        wd.storedMoves.push([targetTube, sourceTube, colorCount]);
        document.getElementById("backButton").style.display = "block";
        document.getElementById("backButton").value = "Back (" + wd.storedMoves.length + ")";
    },
    moveBackOne: function() {
        var move                       = wd.storedMoves.pop();
        if (wd.storedMoves.length === 0) {
            document.getElementById("backButton").style.display = "none";
        } else {
            document.getElementById("backButton").value = "Back (" + wd.storedMoves.length + ")";
        }
        var targetTube                 = move[0];
        var sourceTube                 = move[1];
        var colorCount                 = move[2];
        for (var i = 0; i < colorCount; i += 1) {
            sourceTube.push(targetTube.pop())
        }
        wd.paintTubes();
    },

        /* Evaluate score: flag victory when all tubes empty or filled with unique color */
    evaluateScore: function() {
        for (var tubeIndex = 0; tubeIndex < wd.tubes.length; tubeIndex += 1) {
            var tube                   = wd.tubes[tubeIndex];
            if (tube.length === 0) {
                /* Nothing to do here! */
            } else if (tube.length === 4) {
                var firstColor         = tube[0];
                for (var colorIndex = 1; colorIndex < tube.length; colorIndex += 1) {
                    if (!tube[colorIndex] === firstColor) {
                        return;
                    }
                }                
            } else {
                return;
            }
        }
        var victoryCanvas              = document.getElementById("hiddenVictoryCanvas");
        victoryCanvas.style.display    = "block";
        wd.victoryIncrement            = 0;
        setTimeout(wd.increaseVictorySize, 250);
    },

        /* Victory */
    increaseVictorySize: function() {
        if (wd.victoryIncrement < 6) {
            wd.victoryIncrement       += 1;
            document.getElementById("hiddenVictoryCanvas").style.display = ((wd.victoryIncrement % 2) === 0)? "block": "none";
            setTimeout(wd.increaseVictorySize, 250);
        }
    },
    victory: function() {
        document.getElementById("hiddenVictoryCanvas").style.display    = "none";
        wd.initialize();
    },

};

    /* Set events */
window.onresize                        = wd.paintTubes;
document.addEventListener("DOMContentLoaded", function(event) { setTimeout(wd.initialize, 100); });

/* -\\- */
