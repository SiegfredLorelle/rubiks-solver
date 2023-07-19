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

let cubesSelectButtons;
// let selectedCube;

let colors;
let selectedColor;
let edgeIndex;
let settingsBtn;


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

    findActivePage();
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
}

function onColorAssignPage() {
    // listenToSwipes();
    listenToHold();
    listenToColorTap();
    listenToValueChange();
    window.version = '0.99.2';
    window.game = new Game();
    colorCount = new Map();
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
    console.log(selectedCube);
    changePage("color-assign-page");
}

function listenToSettingsBtnClick() {
    settingsBtn.addEventListener("click", onSettingsBtnClick);
}

function onSettingsBtnClick() {
    console.log(settingsBtn);
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
    console.log(selectedColor);
    // colors.forEach(color => {
    //     color.classList.remove("selected");
    // });
    // event.target.classList.toggle("selected");
    // const indices = [
    //     11, 23, 5 , 17,
    //     21, 18, 15, 12,
    //     20, 8, 14, 2,
    //     6, 9, 0, 3,
    //     7, 19, 10, 22,
    //     4, 16, 1, 13,
    // ]

    
    if (!edgeIndex || edgeIndex >= indices.length) {
        edgeIndex = 0;
    }
    
    console.log([ ...colorCount.values() ], selectedColor);
    if ([ ...colorCount.keys() ].includes(selectedColor)) {
        if (colorCount.get(selectedColor) >= 4) {
            console.log("4 COLORS ALREADY");
            return;
        }
        
        colorCount.set(selectedColor, colorCount.get(selectedColor) + 1);
    }
    else {
        colorCount.set(selectedColor, 1);
    }
    // console.log(colorCount);
    
    
    // const indices = [ ...edgeIndexToColor.keys() ];
    window.game.cube.updateEdgesColors(indices[edgeIndex], selectedColor);
    edgeIndexToColor.set(indices[edgeIndex], selectedColor);
    edgeIndex++;



    // console.log(window.game.controls);
    // console.log(window.game.cube);
    // window.game.themeEditor.getPieceColor(event); 
    
        // window.game.cube.edges.forEach(edge => {
        //     edge.addEventListener("click", () => {
        //         console.log(edge);
        //     });
        // })

}

function listenToValueChange() {
    colors.forEach(color => {
        color.addEventListener("change", onColorChange);
    });
}

function onColorChange(event) {
    selectedColor = event.target.value;
    console.log(selectedColor);
}

function offListeners() {
    unlistenToSwipes();
    unlistenToCubeSelectBntClick();
    reset3Dcube();
}


function reset3Dcube() {
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
    switch (activePageName) {
        case "home-page":
            exitApp();
            break;
        case "cube-select-page":
            changePage("home-page");
            break;
        case "color-assign-page":
            changePage("cube-select-page");
            break;
        case "settings-page":
            changePage("cube-select-page");
            break;

        default:
            console.log("No pg to redirect");
    }
}


function changePage(pageToActivate) {
    pageToActivate = mapPages.get(pageToActivate);

    activePage.classList.remove("active");
    pageToActivate.classList.add("active");
    findActivePage();
    console.log(activePageName);
}

function changePartOfPage(partOfPageToActivate) {

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
            changePage("cube-select-page");
            break;
        case "settings-page":
            changePage("cube-select-page");
            break;
    }
}


