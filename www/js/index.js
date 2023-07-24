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
    [20, 8, 14, 2],     // Right
    [6, 9, 0, 3],       // Rear
    [7, 19, 10, 22],    // Top
    [4, 16, 1, 13],     // Bottom
]

const indicesInMoveU = [6, 9, 11, 23, 21, 18, 20, 8];
const indicesInMoveD = [2, 14, 12, 15, 17, 5, 3, 0];
const indicesInMoveR = [13, 16, 14, 20, 19, 22, 23, 17];
const indicesInMoveL = [5, 11, 10, 7, 8, 2, 4, 1];
const indicesInMoveF = [3, 9, 16, 4, 15, 21, 22, 10];
const indicesInMoveB = [7, 19, 18, 12, 13, 1, 0, 6];

const topEdges = [[9, 10, 11], [6, 7, 8], [22, 22, 23], [18, 19, 20]];
const bottomEdges = [[0, 1, 2], [3, 4, 5], [12, 13, 14], [15, 16, 17]];


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

    // console.log(tryAgainBtn);
    let parts = document.querySelectorAll("main div.part");
    parts.forEach(part => {
        mapParts.set(part.classList[0], part);
    });
    // console.log(mapParts);
    findActivePage();
    findActivePart();

    moveNotationMap.set("U", moveU);
    moveNotationMap.set("U'", moveUPrime);
    moveNotationMap.set("D", moveD);
    moveNotationMap.set("D'", moveDPrime);
    moveNotationMap.set("R", moveR);
    moveNotationMap.set("R'", moveRPrime);
    moveNotationMap.set("L", moveL);
    moveNotationMap.set("L'", moveLPrime);
    moveNotationMap.set("F", moveF);
    moveNotationMap.set("F'", moveFPrime);
    moveNotationMap.set("B", moveB);
    moveNotationMap.set("B'", moveBPrime);
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
    // let test = [15, 16, 17];
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
    }
}

function onSolveBtnTap() {
    changePartOfPage("solver-part");
    checkIsCubeSolved();
}

let i = 0;
function onNextMoveBtnTap() {
    /* NOTE: FOR TESTING ALL MOVES */
    // if (i === moveKeys.length) {
        //     i = 0;
        // }
        // // console.log(moveKeys[i]);
        // moveNotationMap.get(moveKeys[i])();
        // i++;
        
        
    /* NOTE: FOR TESTING move at a time */
    // performMove("R");

    solveCube();

    checkIsCubeSolved();
}


function solveCube() {
    if (!isFirstLayerSolved()) {
        console.log("FIRST LAYER NOT SOLVED!");
    }
    else {
        console.log("FIRST LAYER IS SOLVED!");
    }
}

function isFirstLayerSolved() {
    // console.log("CHECKING IF FIRST LAYER IS SOLVED");
    console.log(edgeIndexToColor);
    // console.log("CHECKING IF CUBE IS SOLVED ...");
    let currentColor;
    let index = 0;
    let counter = 0;
    
    for (const color of edgeIndexToColor.values()) {
        if (!currentColor) {
            currentColor = color;
        }
        console.log(currentColor, color);
        if (currentColor === color) {
            counter++;
        }

        index++;

        if (index === 4) {
            console.log(counter);
            if (counter === 4) {
                if (isFirstLayerEdgesSolved()) {
                    return true;
                }
            }
            index = 0;
            counter = 0;
            currentColor = null;
        }

    }
    return false;
}


function isFirstLayerEdgesSolved() {
    console.log("CHECKING EDGES");
    // CHECK EDGES HERE
    return false;
}




function performMove(moveNotation) {
    // moveKeys = [ ...moveNotationMap.keys() ]
    moveNotationMap.get(moveNotation)();
}




function moveU() {
    const layer = window.game.controls.getLayer( {x: 0, y: 1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveU, false);

}
function moveUPrime() {
    const layer = window.game.controls.getLayer( {x: 0, y: 1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveU, true);
}


function moveD() {
    const layer = window.game.controls.getLayer( {x: 0, y: -1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveD, false);
}
function moveDPrime() {
    const layer = window.game.controls.getLayer( {x: 0, y: -1, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "y" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveD, true);
}

function moveR() {
    const layer = window.game.controls.getLayer( {x: 1, y: 0, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveR, false);
}
function moveRPrime() {
    const layer = window.game.controls.getLayer( {x: 1, y: 0, z: 0} );
    
    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveR, true);
}


function moveL() {
    const layer = window.game.controls.getLayer( {x: -1, y: 0, z: 0} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveL, false);
}
function moveLPrime() {
    const layer = window.game.controls.getLayer( {x: -1, y: 0, z: 0} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "x" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveL, true);
}


function moveF() {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: 1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveF, false);
}
function moveFPrime() {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: 1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;

    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveF, true);
}

function moveB() {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: -1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( 1.6, false);

    updateColors(indicesInMoveB, false);
}
function moveBPrime() {
    const layer = window.game.controls.getLayer( {x: 0, y: 0, z: -1} );

    window.game.controls.flipAxis = new THREE.Vector3();
    window.game.controls.flipAxis[ "z" ] = 1;
    
    window.game.controls.selectLayer( layer );
    window.game.controls.rotateLayer( -1.6, false);

    updateColors(indicesInMoveB, true);
}

function updateColors(indicesToSwap, isReversed) {
    let colorValues = [];

    if (isReversed) {
        indicesToSwap = indicesToSwap.toReversed();
        console.log("REVERSING", indicesToSwap);
    }
    console.log(indicesToSwap);
    for (const i of indicesToSwap) {
        // console.log(i);
        colorValues.push(edgeIndexToColor.get(i));
    }
    console.log(colorValues, "AT START");
    for (let i = 0; i < colorValues.length - 3; i += 2) {
        [colorValues[i], colorValues[i + 2]] = [colorValues[i + 2], colorValues[i]];
        [colorValues[i + 1], colorValues[i + 3]] = [colorValues[i + 3], colorValues[i + 1]];
        console.log(colorValues, "SWAPPING");
    }
    // console.log(values, "NOW");
    for (const [i, color] of colorValues.entries()) {
        // console.log(indicesToSwap[i], color);
        edgeIndexToColor.set(indicesToSwap[i], color);
        // indicesToSwap[i] = color;
        console.log(indicesToSwap[i], edgeIndexToColor.get(indicesToSwap[i]));
    }
}



function onTryAgainBtnTap() {
    changePage("cube-select-page");
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
    partOfPageToActivate = mapParts.get(partOfPageToActivate);
    activePart.classList.remove("active");
    partOfPageToActivate.classList.add("active");
    findActivePart();
    console.log(activePart);
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
            // console.log(activePartName);
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
                    break;
                default:
                    console.log("ERROR");
            }
            break;
        case "settings-page":
            changePage("cube-select-page");
            break;
    }
}


