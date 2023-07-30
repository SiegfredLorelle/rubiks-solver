/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    // document.getElementById('deviceready').classList.add('ready');

    onStart();
    document.addEventListener("backbutton", onBackButton, false);

}

let activePage;
let activePageName;
let mapPages = new Map();
let activePart;
let activePartName;
let mapParts = new Map();

let cubesSelectButtons;
// let selectedCube;

let colors;
let selectedColor;
let edgeIndex;
let settingsBtn;
let solveBtn;
let nextMoveBtn;
let backMoveBtn;
let tryAgainBtn;
let feedbackBtn;

let edgeIndexToColor = new Map();
edgeIndexToColor.set(11, null);
edgeIndexToColor.set(23, null);
edgeIndexToColor.set(5, null);
edgeIndexToColor.set(17, null);
edgeIndexToColor.set(21, null);
edgeIndexToColor.set(18, null);
edgeIndexToColor.set(15, null);
edgeIndexToColor.set(12, null);
edgeIndexToColor.set(20, null);
edgeIndexToColor.set(8, null);
edgeIndexToColor.set(14, null);
edgeIndexToColor.set(2, null);
edgeIndexToColor.set(6, null);
edgeIndexToColor.set(9, null);
edgeIndexToColor.set(0, null);
edgeIndexToColor.set(3, null);
edgeIndexToColor.set(7, null);
edgeIndexToColor.set(19, null);
edgeIndexToColor.set(10, null);
edgeIndexToColor.set(22, null);
edgeIndexToColor.set(4, null);
edgeIndexToColor.set(16, null);
edgeIndexToColor.set(1, null);
edgeIndexToColor.set(13, null);

const indices = [ ...edgeIndexToColor.keys() ];
let colorCount = new Map();


let moveNotationMap = new Map();


const sides = [
    [11, 23, 5, 17],    // Left
    [21, 18, 15, 12],   // Front
    [2, 14, 8, 20],     // Right
    [6, 9, 0, 3],       // Rear
    [7, 19, 10, 22],    // Top
    [4, 16, 1, 13],     // Bottom
]

const indicesInMoveU = [6, 9, 11, 23, 21, 18, 20, 8];
const indicesInMoveD = [2, 14, 12, 15, 17, 5, 3, 0];
const indicesInMoveR = [16, 13, 14, 20, 19, 22, 23, 17];
const indicesInMoveL = [5, 11, 10, 7, 8, 2, 1, 4];
const indicesInMoveF = [9, 3, 4, 16, 15, 21, 22, 10];
const indicesInMoveB = [7, 19, 18, 12, 13, 1, 0, 6];
const sidesInMoveX = [sides[5], sides[2], sides[4], sides[0]];
const sidesInMoveY = [sides[0], sides[1], sides[2].toReversed(), sides[3]];
const sidesInMoveZ = [sides[1], [10, 7, 22, 19], [3, 0, 9, 6], [16, 13, 4, 1]];
const movesInMoveY = [["L", "F", "R", "B"], ["L'", "F'", "R'", "B'"]];
const movesInMoveX = [["U", "F", "D", "B"], ["U'", "F'", "D'", "B'"]];
const movesInMoveZ = [["R", "U", "L", "D"], ["R'", "U'", "L'", "D'"]];

const topEdges = [
    [21, 22, 23], 
    [9, 10, 11], 
    [6, 7, 8], 
    [18, 19, 20], 
];
const bottomEdges = [
    [15, 16, 17],
    [3, 4, 5], 
    [0, 1, 2], 
    [12, 13, 14], 
];

let pendingMoves = [];

let touchStartX = 0;
let touchEndX = 0;

let holdTimer;
const MIN_TOUCH_DURATION = 300;


function onStart() {
    
    let pages = document.querySelectorAll("main > div");
    pages.forEach(page => {
        mapPages.set(page.classList[0], page);
    });

    selectedColor = document.querySelector(".color-assign-page .color-container > .flex-row > input[type='color'].selected").value;
    cubesSelectButtons = document.querySelectorAll(".cube-sizes-container li > *");
    colors = document.querySelectorAll(".color-container > div > input");
    settingsBtn = document.querySelector(".cube-select-page .bottom-icon-container > i:last-child");
    // edgeIndex = 7;
    solveBtn = document.querySelector(".color-assign-page > .color-assign-part > .solve-reset-container > .solve-btn");
    nextMoveBtn = document.querySelector(".color-assign-page > .solver-part .next-move-btn");
    tryAgainBtn = document.querySelector(".color-assign-page > .solved-part .try-again-btn");
    feedbackBtn = document.querySelector(".settings-page li > button[value=Feedback]");
    // console.log(feedbackBtn);
    let parts = document.querySelectorAll("main div.part");
    parts.forEach(part => {
        mapParts.set(part.classList[0], part);
    });
    // console.log(mapParts);
    findActivePage();
    findActivePart();

    moveNotationMap.set("U", moveU);
    moveNotationMap.set("U'", moveUPrime);
    moveNotationMap.set("U-indices", [6, 9, 11, 23, 21, 18, 20, 8]);
    moveNotationMap.set("U-edges", [22, 19, 7, 10]);

    moveNotationMap.set("D", moveD);
    moveNotationMap.set("D'", moveDPrime);
    moveNotationMap.set("D-indices", [2, 14, 12, 15, 17, 5, 3, 0]);
    moveNotationMap.set("D-edges", [4, 1, 13, 16]);

    moveNotationMap.set("R", moveR);
    moveNotationMap.set("R'", moveRPrime);
    moveNotationMap.set("R-indices", [16, 13, 14, 20, 19, 22, 23, 17]);
    moveNotationMap.set("R-edges", [12, 18, 21, 15]);

    moveNotationMap.set("L", moveL);
    moveNotationMap.set("L'", moveLPrime);
    moveNotationMap.set("L-indices", [5, 11, 10, 7, 8, 2, 1, 4]);
    moveNotationMap.set("L-edges", [0, 3, 9, 6]);

    moveNotationMap.set("F", moveF);
    moveNotationMap.set("F'", moveFPrime);
    moveNotationMap.set("F-indices", [9, 3, 4, 16, 15, 21, 22, 10]);
    moveNotationMap.set("F-edges", [5, 17, 23, 11]);

    moveNotationMap.set("B", moveB);
    moveNotationMap.set("B'", moveBPrime);
    moveNotationMap.set("B-indices", [7, 19, 18, 12, 13, 1, 0, 6]);
    moveNotationMap.set("B-edges", [14, 2, 8, 20]);

    moveNotationMap.set("X", moveX);
    moveNotationMap.set("X'", moveXPrime);
    moveNotationMap.set("Y", moveY);
    moveNotationMap.set("Y'", moveYPrime);
    moveNotationMap.set("Z", moveZ);
    moveNotationMap.set("Z'", moveZPrime);
}

/* FOR TESTING ON WEB, ON ANDROID DEVICES USE ON DEVICE READY ON MOBILE APPS */
onStart();

function exitApp() {
    if (confirm("Exit?")) {
        navigator.app.exitApp();
    }
}

function findActivePage() {
    activePage = document.querySelector("main > div.active");
    activePageName = activePage.classList[0]; 

    offListeners();
    manageActivePage();
}


function findActivePart() {
    // switch(activePage) {
    activePart = document.querySelector("main div.part.active");
    // console.log(activePart.classList[0]);
    activePartName = activePart.classList[0];
}

function manageActivePage() {
    if (activePageName === "home-page") {
        onHomePage();
    }
    else if (activePageName === "cube-select-page") {
        onCubeSelectPage();
    }

    else if (activePageName === "color-assign-page") {
        onColorAssignPage();
    }
    else if (activePageName === "settings-page") {
        onSettingsPage();
    }
    else if (activePageName === "feedback-page") {
        onFeedbackPage();
    }
}


function onHomePage() {
    listenToSwipes();
}

function onCubeSelectPage() {
    listenToSwipes();
    listenToCubeSelectBtnClick();
    listenToSettingsBtnClick();
    solveBtn.disabled = true;
}

function onColorAssignPage() {
    // listenToSwipes();
    listenToHold();
    listenToColorTap();
    listenToValueChange();
    listenToBtnTap(tryAgainBtn);
    window.version = '0.99.2';
    window.game = new Game();
    colorCount.clear();
    edgeIndex = 0;
    // window.game.cube.size = 2;
}

function onSettingsPage() {
    listenToSwipes();
    listenToBtnTap(feedbackBtn);
}

function onFeedbackPage() {
    listenToSwipes();
}

function listenToCubeSelectBtnClick() {
    cubesSelectButtons.forEach(button => {
        button.addEventListener("click", onCubeSelectBtnClick);
    });
}

function unlistenToCubeSelectBntClick() {
    cubesSelectButtons.forEach(button => {
        button.addEventListener("click", onCubeSelectBtnClick);
    });
}

function onCubeSelectBtnClick(event) {
    selectedCube = event.target.value;
    // console.log(selectedCube);
    changePage("color-assign-page");
}

function listenToSettingsBtnClick() {
    settingsBtn.addEventListener("click", onSettingsBtnClick);
}

function onSettingsBtnClick() {
    // console.log(settingsBtn);
    changePage("settings-page");
}

function listenToHold() {
    
    colors.forEach(color => {
        color.addEventListener("touchstart", startHoldTimer);
        color.addEventListener("touchend", resetHoldTimer);
        color.addEventListener("touchmove", resetHoldTimer);
    });
}

function startHoldTimer(event) {
    holdTimer = setTimeout(() => {
        onHold(event.target);
    }, MIN_TOUCH_DURATION);
    disableColors();
}

function resetHoldTimer() {
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = 0;
    }
}

function onHold(heldColor) {
    // console.log("HOLD", heldColor);
    heldColor.disabled = false;
    heldColor.click();
    
}

function disableColors() {
    colors.forEach(color => {
        color.disabled = true;
        color.blur();
    });
}


function listenToColorTap() {
    colors.forEach(color => {
        color.addEventListener("touchstart", onSelectColor);
    })
}

function onSelectColor(event) {
    selectedColor = event.target.value;

    if (!edgeIndex || edgeIndex >= indices.length) {
        edgeIndex = 0;
    }
    
    if ([ ...colorCount.keys() ].includes(selectedColor)) {
        if (colorCount.get(selectedColor) >= 4) {
            return;
        }
        
        colorCount.set(selectedColor, colorCount.get(selectedColor) + 1);

        if (checkCubeValidity()) {
            listenToBtnTap(solveBtn);
            listenToBtnTap(nextMoveBtn);
            solveBtn.disabled = false;
            // checkIsCubeSolved();

        }
    }
    else {
        colorCount.set(selectedColor, 1);
    }

    window.game.cube.updateEdgesColors(indices[edgeIndex], selectedColor);
    edgeIndexToColor.set(indices[edgeIndex], selectedColor);
    edgeIndex++;

    /* FOR TESTING ONLY */
    // let test = sides[1].concat([10, 7, 22, 19]).concat([3, 0, 9, 6]).concat([16, 13, 4, 1]);
    // // test = [20, 8, 2, 14];
    // test = [10, 7, 19, 22];
    // window.game.cube.updateEdgesColors(test[edgeIndex], selectedColor);
    // edgeIndexToColor.set(test[edgeIndex], selectedColor);
    // edgeIndex++;


}


function checkIsCubeSolved() {
    console.log(edgeIndexToColor);
    // console.log("CHECKING IF CUBE IS SOLVED ...");
    let currentColor;
    let index = 0;
    
    for (const color of edgeIndexToColor.values()) {
        // console.log(index, color);
        if (!currentColor) {
            currentColor = color;
        }
        else if (index === 4) {
            index = 0;
            currentColor = color;
        }
        else if (currentColor !== color) {
            return;
        }
        index++;
    }

    onCubeSolved();
}

function onCubeSolved() {
    // console.log("CONGRATS CUBE IS SOLVED");

    changePartOfPage("solved-part");
}

function checkCubeValidity() {
    const clrCounts = [ ...colorCount.values() ];

    if (clrCounts.length < 6) {
        return false;
    }

    for (let count of clrCounts) {
        // console.log(count);
        if (count < 4) {
            return false;
        }
    }
    return true;
}

function listenToValueChange() {
    colors.forEach(color => {
        color.addEventListener("change", onColorChange);
    });
}

function onColorChange(event) {
    selectedColor = event.target.value;
    // console.log(selectedColor);
}

function listenToBtnTap(btn) {
    switch (btn) {
        case solveBtn:
            solveBtn.addEventListener("click", onSolveBtnTap);
            break;
        case nextMoveBtn:
            nextMoveBtn.addEventListener("click", onNextMoveBtnTap);
            break;
        case tryAgainBtn:
            tryAgainBtn.addEventListener("click", onTryAgainBtnTap);
            break;
        case feedbackBtn:
            feedbackBtn.addEventListener("click", onFeedbackBtnTap);
    }
}

function onSolveBtnTap() {
    changePartOfPage("solver-part");
    checkIsCubeSolved();
}

let i = 0;
function onNextMoveBtnTap() {
    /* NOTE: FOR TESTING ALL MOVES */
    // // let moveKeys = [...moveNotationMap.keys()]
    // moveKeys = ["R", "R'", "L", "L'", "U", "U'", "D", "D'", "B", "B'", "F", "F'", "X", "X'", "Y", "Y'", "Z", "Z'"];
    // // moveKeys = ["R", "R'", "L", "L'", "U", "U'", "D", "D'", "B", "B'", "F", "F'", "Z'"];
    // // moveKeys = ["R", "R'", "Y", "R'", "Y", "L'"];
    // // moveKeys = ["R", "R'", "Y"];
    // moveKeys = ["X"];
    // if (i === moveKeys.length) {
    //         i = 0;
    //     }
    // // console.log(moveKeys[i]);
    // // moveNotationMap.get(moveKeys[i])();
    // performMove(moveKeys[i]);

    // i++;




    /* ACTUAL CODE */
    if (!pendingMoves.length) {
        checkIsCubeSolved();
        solveCube();
    }
    if (pendingMoves.length) {
        performMove(pendingMoves.shift());
    }
    console.log(pendingMoves);
    


}


function solveCube() {
    if (!isFirstLayerSolved()) {
        solveFirstLayer();
    }
    else {
        console.log("FIRST LAYER IS SOLVED!");
    }
}

let isFirstLayerFound = false;
let maxColor = [];
let color = [];
let firstLayerClrCount;
let firstLayerSide;

function solveFirstLayer() {
    console.log("SOLVING FIRST LAYER");

    if (!isFirstLayerFound) {
        /* FIND THE SIDE FOR FIRST LAYER */
        // let colorCount = new Map(); // color : count
        maxColor = [null, 0]; // side, count, color
        color = null;
        
        for (const sideF of sides) {
    
            // FIND EDGE CLOSEST TO BEING SOLVED
            const side = [...sideF];
            [side[2], side[3]] = [side[3], side[2]];
            // colorCount.clear();
            let count = 0;
            for (let i = 0; i < side.length; i++) {
                // console.log(edgeIndexToColor.get(side[0]), edgeIndexToColor.get(side[0]));
                if (edgeIndexToColor.get(side[0]) === edgeIndexToColor.get(side[1])) {
                    count++;
                    color = edgeIndexToColor.get(side[0]);
                    console.log("DURING", count);
                }
                
                side.push(side.shift());
            }
            
            // console.log("FINAL", count);
            if (count >= maxColor[1]) {
                maxColor = [side, count];
                // color = side;
                // console.log("SIDE TOOO", side);
            }
        }


        isFirstLayerFound = true;
        firstLayerClrCount = maxColor[1];
        firstLayerSide = maxColor[0];
        console.log(firstLayerSide, firstLayerClrCount);


        // let firstLayerColor = [...colorCount.valu[es].indexOf(maxColor[1]); 
        // ROTATE SIDE TO BOTTOM
        console.log(!isFirstLayerAtBottomSide(firstLayerSide));
        if (!isFirstLayerAtBottomSide(firstLayerSide)) {
            moveFirstLayerAtBottomSide(firstLayerSide);
            return;
        }
    }



    // FIND CORRECT AND INCORRECT PIECES IN FIRST LAYER
    // console.log(firstLayerClrCount);
    if (firstLayerClrCount > 0) {
        // console.log("PUMASOK");
        let btmLayer = [1, 4, 16, 13];
        let edges = []; 

        for (let i = 0; i < btmLayer.length; i++) {
            // console.log(btmLayer[0], btmLayer[1]);
            // CHECK IF THEIR EDGES ARE CORRECT
            if (edgeIndexToColor.get(btmLayer[0]) === edgeIndexToColor.get(btmLayer[1])) {
                console.log(`SAME COLOR: ${btmLayer[0]}, ${btmLayer[1]}`);
                
                // FIND SIDE CONTAINING BOTH EDGES
                for (const btmEdge of bottomEdges) {
                    console.log(btmEdge);
                    if (btmEdge.includes(btmLayer[0])
                        || btmEdge.includes(btmLayer[1])) {
                        edges = edges.concat(btmEdge);
                    }

                    if (edges.length >= 6) {
                        break;
                    }
                }

            console.log(`EDGES: ${edges}`);
            edges = edges.filter((edge) => {
                return !firstLayerSide.includes(edge);
            })
            console.log(`NEW EDGES: ${edges}`);


            while (edges.length > 0) {
                const edge = edges.shift();
        
                for (const sideL of sides) {
                    if (sideL === edges) {
                        continue;
                    }
        
                    if (sideL.includes(edge)) {
                        for (const otherEdge of edges) {
                            if (sideL.includes(otherEdge)) {
                                edges.splice(edges.indexOf(otherEdge), 1);
                                if (edgeIndexToColor.get(edge) === edgeIndexToColor.get(otherEdge)) {
                                    console.log(`CORRECT EDGE: ${edge} and ${otherEdge}`);
                                    
                                    const [leftSide, rightSide] = findLeftAndRight(edge, otherEdge);

                                    // CHECK IF LEFT AND RIGHT IS CORRECT
                                    console.log(leftSide, rightSide);
                                    // CHECK IF COLOR IS CORRECT
                                    // console.log(btmLayer.at(-1), btmLayer.at(btmLayer.indexOf(otherEdge + 1)));
                                    if (edgeIndexToColor.get(leftSide[0]) === edgeIndexToColor.get(leftSide[1])) {
                                        // GO TO NEXT SIDE
                                        console.log("GO TO NEXT SIDE");
                                    }
                                    else {
                                        console.log("FIX LEFT SIDE");
                                        insertEdge(edgeIndexToColor.get(leftSide[1]), leftSide[0], color);
                                    }

                                    // if (edgeIndexToColor.get(rightSide[0]) === edgeIndexToColor.get(rightSide[1])) {
                                    //     console.log("GO TO NEXT SIDE");
                                    // }
                                    // else {
                                    //     console.log("FIX RIGHT SIDE");
                                    //     // insertEdge(edgeIndexToColor.get(rightSide[0]), rightSide[1], color);
                                    // }
                                    

                                }
                            }
                        }
                    }
                }
            }
                // console.log("");
            }


            btmLayer.push(btmLayer.shift());
        }
    }
    
    
    
    
}

// IF COUNT IS > 2
    // FIND PIECES THAT ARE BESIDE EACH OTHER
        // CHECK IF THEIR EDGES ARE CORRECT

// NO EDGES, PICK ONE TO BE CORRECT
// FIND SAME COLOR OPPOSITE SIDE
// ALLIGN MISSING PIECE


// }

let isEdgesToInsertAligned = false;
function insertEdge(edgeColor, whereToPlace, firstLayerColor) { 
    console.log("FINDING", edgeColor, firstLayerColor, whereToPlace);
    let edgeToMove;
    if (!isEdgesToInsertAligned) {
        loop1:
            for (const topEdge of topEdges) {
                let reqColor = [edgeColor, firstLayerColor]
            loop2:
                for (const edge of topEdge) {
                    if (reqColor.includes(edgeIndexToColor.get(edge))) {
                        reqColor.splice(reqColor.indexOf(edgeIndexToColor.get(edge)), 1);
                    }
    
                    if (!reqColor.length) {
                        console.log("EDGE IS FOUND!", edge);
                        edgeToMove = edge;
                        break loop1;
                    }
                }
            }
        for (const [i, topEdgesF] of topEdges.entries()) {
            if (topEdgesF.includes(edgeToMove)) {
                for (let j = 0; j < i; j++) {
                    pendingMoves.push("U'");
                }
            }
        }
        for (const [i, btmEdges] of bottomEdges.entries()) {
            if (btmEdges.includes(whereToPlace)) {
                for (let j = 0; j < i; j++) {
                    pendingMoves.push("D");
                }
            }
        }
        isEdgesToInsertAligned = true;

    }
    // REPEAT UNTIL LAYER COLOR IS CORRECT AND EDGE COLOR IS CORRECT
    pendingMoves.push("R");
    pendingMoves.push("U");
    pendingMoves.push("R'");
    pendingMoves.push("U'");

    console.log("DONEE!!");

    console.log("MOVES COMPLETE");

}

function findLeftAndRight(edge, otherEdge) {

    let edgesLayer = [[0, 3], [5, 17], [15, 12], [14, 2]];

    for (let [i, edgeLayer] of edgesLayer.entries()) {
        if (edgeLayer.includes(edge), edgeLayer.includes(otherEdge)) {
            // console.log(edgeLayer);
            if (i === 0) {
                leftSide = edgesLayer[3]
                rightSide = edgesLayer[edgesLayer.indexOf(edgeLayer) + 1]
            }

            else if (i === 3) {
                leftSide = edgesLayer[edgesLayer.indexOf(edgeLayer) - 1]
                rightSide = edgesLayer[0]
            }
            else {
                leftSide = edgesLayer[edgesLayer.indexOf(edgeLayer) - 1]
                rightSide = edgesLayer[edgesLayer.indexOf(edgeLayer) + 1]
            }
        }
    }
    return [leftSide, rightSide];
}


function isFirstLayerSolved() {
    for (const side of sides) {
        let color = edgeIndexToColor.get(side[0]); 
        let counter = 0;
        for (const edge of side) {
            if (edgeIndexToColor.get(edge) !== color) {
                break;
            }
            else {
                counter++;
            }
        }
        console.log(side, counter);

        if (counter === 4) {
            if (isFirstLayerEdgesSolved(side)) {
                if (!isFirstLayerAtBottomSide(side)) {
                    moveFirstLayerAtBottomSide(side);
                }
                return true;
            }
        }
    }

    return false;
}

function isFirstLayerAtBottomSide(side) {
    if (side[0] !== sides[sides.length - 1][0   ]) {
        return false;
    }
    else {
        return true;
    }
}

function moveFirstLayerAtBottomSide(firstLayer) {
    if (firstLayer[0] === sides[4][0]) {
        pendingMoves.push("Z");
        pendingMoves.push("Z");
    }
    else if (firstLayer[0] === sides[0][0]) {
        pendingMoves.push("X'");
    }
    else if (firstLayer[0] === sides[1][0]) {
        pendingMoves.push("Z");
    }
    else if (firstLayer[0] === sides[2][0]) {
        pendingMoves.push("X");
    }
    else if (firstLayer[0] === sides[3][0]) {
        pendingMoves.push("Z'");
    }
}

function isFirstLayerEdgesSolved(side) {
    console.log("CHECKING EDGES");
    // CHECK EDGES HERE
    // let edgesArray = topEdges.concat(bottomEdges);

    // GET ALL EDGES OF THE FIRST LAYER
    let edgesOfFirstLayer = [];

    for (const arr of topEdges.concat(bottomEdges)) {
        for (edge of arr) {
            if (side.includes(edge)) {
                edgesOfFirstLayer = edgesOfFirstLayer.concat(arr);
                break;
            }
        }
    }

    edgesOfFirstLayer = edgesOfFirstLayer.filter((edge) => {
        return !side.includes(edge);
    });

    console.log(edgesOfFirstLayer, "EDGES OF FIRST");

    // CHECK IF EDGES ARE CORRECT
    
    while (edgesOfFirstLayer.length > 0) {
        const edge = edgesOfFirstLayer.shift();

        for (const sideL of sides) {
            if (sideL === side) {
                continue;
            }

            if (sideL.includes(edge)) {
                for (const otherEdge of edgesOfFirstLayer) {
                    if (sideL.includes(otherEdge)) {
                        edgesOfFirstLayer.splice(edgesOfFirstLayer.indexOf(otherEdge), 1);

                        console.log(edge, edgeIndexToColor.get(edge), otherEdge, edgeIndexToColor.get(otherEdge));
                        if (edgeIndexToColor.get(edge) !== edgeIndexToColor.get(otherEdge)) {
                            return false;
                        }
                    }
                }
                break;
            }
        }
    }
    return true;
}



function performMove(moveNotation) {
    moveNotationMap.get(moveNotation)(moveNotation);
}

// let layer = {x: 0, y: 1, z: 0};`


function moveU(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));

}
function moveUPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 1, z: 0} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));
}


function moveD(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: -1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));
}
function moveDPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: -1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));

}

function moveR(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 1, y: 0, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));
}
function moveRPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 1, y: 0, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));
}


function moveL(moveNotation) {
    const layer = window.game.controls.getLayer( {x: -1, y: 0, z: 0} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));
}
function moveLPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: -1, y: 0, z: 0} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));
}


function moveF(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: 1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));
}
function moveFPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: 1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));
}

function moveB(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: -1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation}-indices`), false, moveNotationMap.get(`${moveNotation}-edges`));
}
function moveBPrime(moveNotation) {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: -1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(moveNotationMap.get(`${moveNotation.charAt(0)}-indices`), true, moveNotationMap.get(`${moveNotation.charAt(0)}-edges`));
}

function moveX() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    window.game.controls.state = ROTATING;

    window.game.controls.rotateCube( -1.6, () => {
        window.game.controls.state = STILL;
    });

    updateSides(sidesInMoveX, false, [6, 9, 3, 0], [15, 12, 18, 21]);
    updateMoveNotation(movesInMoveX, false);
    
}

function moveXPrime() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    window.game.controls.state = ROTATING;
    
    window.game.controls.rotateCube( 1.6, () => {
        
        window.game.controls.state = STILL;
    } );

    updateSides(sidesInMoveX, true, [6, 9, 3, 0], [15, 12, 18, 21]);
    updateMoveNotation(movesInMoveX, true);
}

function moveY() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    window.game.controls.state = ROTATING;

    window.game.controls.rotateCube( -1.6, () => {
        window.game.controls.state = STILL;
    } );

    updateSides(sidesInMoveY, false, [22, 19, 7, 10], [1, 4, 16, 13]);
    updateMoveNotation(movesInMoveY, false);
}

function moveYPrime() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    window.game.controls.state = ROTATING;
    
    window.game.controls.rotateCube( 1.6, () => {
        window.game.controls.state = STILL;
    } );

    updateSides(sidesInMoveY, true, [22, 19, 7, 10], [1, 4, 16, 13]);
    updateMoveNotation(movesInMoveY, true);
    
}

function moveZ() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    window.game.controls.state = ROTATING;
    
    window.game.controls.rotateCube( -1.6, () => {
        
        window.game.controls.state = STILL;
    } );
    updateSides(sidesInMoveZ, false, [5, 17, 23, 11], [20, 8, 2, 14]);
    updateMoveNotation(movesInMoveZ, false);
    
}

function moveZPrime() {
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    window.game.controls.state = ROTATING;
    
    window.game.controls.rotateCube( 1.6, () => {
        window.game.controls.state = STILL;
    } );
    updateSides(sidesInMoveZ, true, [5, 17, 23, 11], [20, 8, 2, 14]);
    updateMoveNotation(movesInMoveZ, true);
}



function updateColors(indicesToSwap, isReversed, edgesToSwap) {
    // UPDATE COLORS OF ROTATING LAYER
    let colorValues = [];

    if (isReversed) {
        indicesToSwap = indicesToSwap.toReversed();
        edgesToSwap = edgesToSwap.toReversed();
        console.log("REVERSING", indicesToSwap);
    }
    console.log(indicesToSwap);
    for (const i of indicesToSwap) {
        colorValues.push(edgeIndexToColor.get(i));
    }
    console.log(colorValues, "AT START");
    for (let i = 0; i < colorValues.length - 3; i += 2) {
        [colorValues[i], colorValues[i + 2]] = [colorValues[i + 2], colorValues[i]];
        [colorValues[i + 1], colorValues[i + 3]] = [colorValues[i + 3], colorValues[i + 1]];
        console.log(colorValues, "SWAPPING");
    }

    for (const [i, color] of colorValues.entries()) {
        edgeIndexToColor.set(indicesToSwap[i], color);
        console.log(indicesToSwap[i], edgeIndexToColor.get(indicesToSwap[i]));
    }

    // UPDATE COLORS OF THE EDGE OF THE ROTATING LAYER
    console.log(edgesToSwap);
    for (let i = 0; i < edgesToSwap.length - 1; i++) {
        console.log(edgeIndexToColor.get(edgesToSwap[i]), edgeIndexToColor.get(edgesToSwap[i+1]) );
        let tmp = edgeIndexToColor.get(edgesToSwap[i]);
        edgeIndexToColor.set(edgesToSwap[i], edgeIndexToColor.get(edgesToSwap[i+1]));
        edgeIndexToColor.set(edgesToSwap[i+1], tmp);
    }
}

// const sidesInMoveX = [sides[0], sides[4], sides[2], sides[5]];
function updateSides(sidesToSwap, reversed, edge1ToSwap, edge2ToSwap) {
    if (reversed) {
        sidesToSwap = sidesToSwap.toReversed();
        edge1ToSwap = edge1ToSwap.toReversed();
        edge2ToSwap = edge2ToSwap.toReversed();
    }

for (let i = 0; i < sidesToSwap.length - 1; i++) {
    console.log(edgeIndexToColor);
    console.log(sidesToSwap[i]);
    for (let j = 0; j < sidesToSwap[i].length; j++) {
        console.log(sidesToSwap[i][j], sidesToSwap[i+1][j]);
        let tmp = edgeIndexToColor.get(sidesToSwap[i][j]);
        edgeIndexToColor.set(sidesToSwap[i][j], edgeIndexToColor.get(sidesToSwap[i+1][j]));
        edgeIndexToColor.set(sidesToSwap[i+1][j], tmp);
        }

        console.log(edgeIndexToColor);
    }

// console.log("ADJUSTING EDGES");
// console.log(edge1ToSwap);
    for (let i = 0; i < edge1ToSwap.length - 1; i++) {
        console.log(edgeIndexToColor.get(edge1ToSwap[i]), edgeIndexToColor.get(edge1ToSwap[i+1]) );
        let tmp = edgeIndexToColor.get(edge1ToSwap[i]);
        edgeIndexToColor.set(edge1ToSwap[i], edgeIndexToColor.get(edge1ToSwap[i+1]));
        edgeIndexToColor.set(edge1ToSwap[i+1], tmp);
        
        tmp = edgeIndexToColor.get(edge2ToSwap[i]);
        edgeIndexToColor.set(edge2ToSwap[i], edgeIndexToColor.get(edge2ToSwap[i+1]));
        edgeIndexToColor.set(edge2ToSwap[i+1], tmp);
    }
}


function updateMoveNotation(movesToShuffle, reversed) {
    let movesNonPrime = movesToShuffle[0];
    let movesPrime = movesToShuffle[1];
    
    if (reversed) {
        movesNonPrime = movesNonPrime.toReversed();
        movesPrime = movesPrime.toReversed();
    }
    console.log(movesNonPrime);
    console.log(movesPrime);

    for (let i = 0; i < movesNonPrime.length - 1; i++) {

        // Swap non prime moves
        let tmp = moveNotationMap.get(movesNonPrime[i]);
        moveNotationMap.set(movesNonPrime[i], moveNotationMap.get(movesNonPrime[i+1]));
        moveNotationMap.set(movesNonPrime[i+1], tmp);
        console.log(moveNotationMap.get(`${movesNonPrime[i]}-indices`), moveNotationMap.get(`${movesNonPrime[i+1]}-indices`));
        
        // // Swap the indices used for the moves
        // tmp = moveNotationMap.get(`${movesNonPrime[i]}-indices`);
        // moveNotationMap.set(`${movesNonPrime[i]}-indices`, moveNotationMap.get(`${movesNonPrime[i+1]}-indices`));
        // moveNotationMap.set(`${movesNonPrime[i+1]}-indices`, tmp);
        
        // // Swap the edges used for the moves
        // tmp = moveNotationMap.get(`${movesNonPrime[i]}-edges`);
        // moveNotationMap.set(`${movesNonPrime[i]}-edges`, moveNotationMap.get(`${movesNonPrime[i+1]}-edges`));
        // moveNotationMap.set(`${movesNonPrime[i+1]}-edges`, tmp);
        
        // Swap prime moves
        tmp = moveNotationMap.get(movesPrime[i]);
        moveNotationMap.set(movesPrime[i], moveNotationMap.get(movesPrime[i+1]));
        moveNotationMap.set(movesPrime[i+1], tmp);
    }
}


function onTryAgainBtnTap() {
    changePage("cube-select-page");
}

function onFeedbackBtnTap() {
    changePage("feedback-page");
}

function offListeners() {
    unlistenToSwipes();
    unlistenToCubeSelectBntClick();
}


function reset3Dcube() {
    window.version = null;
    window.game = null;
    gameCanvas = document.querySelector(".ui__game");
    for (const canvas of gameCanvas.children) {
        canvas.remove();
    }
}

function listenToSwipes() {
    touchStartX = 0;
    touchEndX = 0;

    addEventListener("touchstart", respondTouchStart);
    addEventListener("touchend", respondTouchEnd);
}

function respondTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
}
function respondTouchEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    checkIfSwipe();
}

function unlistenToSwipes() {
    removeEventListener("touchstart", respondTouchStart);
    removeEventListener("touchend", respondTouchEnd);
}

function checkIfSwipe() {
    let distance = Math.abs(touchStartX - touchEndX)
    const MIN_SWIPE_DISTANCE = 50;

    if (distance >= MIN_SWIPE_DISTANCE) {
        checkSwipeDirection();
    }
}

function checkSwipeDirection() {
    if (touchStartX > touchEndX) {
        onSwipeRight();
    }
    else {
        onSwipeLeft();
    }
}

function onSwipeRight() {
    switch (activePageName) {
        case "home-page":
            changePage("cube-select-page");
            break;
        default:
            console.log("No pg to redirect");
    }
}

function onSwipeLeft() {
    switch(activePageName) {
        case "home-page":
            exitApp();
            break;
        case "cube-select-page":
            changePage("home-page");
            break;
        case "color-assign-page":
            console.log(activePartName);
            switch(activePartName) {
                case "color-assign-part":
                    // changePartOfPage("solver-part");
                    changePage("cube-select-page");
                    break;
                case "solver-part":
                    changePartOfPage("color-assign-part");
                    break;
                case "solved-part":
                    changePage("cube-select-page");
                default:
                    console.log("ERROR");
            }
            break;
        case "settings-page":
            changePage("cube-select-page");
            break;
        case "feedback-page":
            changePage("settings-page");
            break;
        default:
            console.log("NO PG TO REDITECT!");
    }   
}


function changePage(pageToActivate) {
    pageToActivate = mapPages.get(pageToActivate);
    activePage.classList.remove("active");
    pageToActivate.classList.add("active");
    reset3Dcube();
    findActivePage();
    console.log(activePageName);

    if (activePart !== "color-assign-part") {
        changePartOfPage("color-assign-part");
    }
}

function changePartOfPage(partOfPageToActivate) {
    // NOTE: ENABLE THIS WHEN DONE TESTING
    // if (partOfPageToActivate === "solver-part") {
    //     window.game.controls.disable();
    // }

    partOfPageToActivate = mapParts.get(partOfPageToActivate);
    activePart.classList.remove("active");
    partOfPageToActivate.classList.add("active");
    findActivePart();
    console.log(activePart);

    // else {
    //     window.game.controls.enable();
    // }
}

function onBackButton() {
    switch(activePageName) {
        case "home-page":
            exitApp();
            break;
        case "cube-select-page":
            changePage("home-page");
            break;
        case "color-assign-page":
            console.log(activePartName);
            switch(activePartName) {
                case "color-assign-part":
                    // changePartOfPage("solver-part");
                    changePage("cube-select-page");
                    break;
                case "solver-part":
                    changePartOfPage("color-assign-part");
                    break;
                case "solved-part":
                    changePage("cube-select-page");
                default:
                    console.log("ERROR");
            }
            break;
        case "settings-page":
            changePage("cube-select-page");
            break;
        case "feedback-page":
            changePage("settings-page");
            break;
        default:
            console.log("NO PG TO REDITECT!");
    }
}

// ================= FEEDBACK FORM =================

function sendEmail(subject, body, recipients, ccList, bccList) {
    // Check if the plugin is available
    if (window.plugins && window.plugins.emailComposer) {
        window.plugins.emailComposer.showEmailComposerWithCallback(
            function(result) {
                if (result === 0) {
                    console.log("Email sent successfully.");
                } else {
                    console.log("Email not sent.");
                }
            },
            subject,
            body,
            recipients,
            ccList,
            bccList,
            false, // isHTML (true: body is HTML, false: body is plain text)
            null, // attachments (file paths or base64 data)
            null, // attachment names
            null, // attachment types
        );
    } else {
        console.log("The 'emailComposer' plugin is not available.");
    }
}


