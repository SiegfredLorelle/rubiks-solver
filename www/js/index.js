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
let touchStartListener;
let touchEndListener;

let touchStartX = 0;
let touchEndX = 0;


function onStart() {
    findActivePage();
    
    let pages = document.querySelectorAll("main > div");
    pages.forEach(page => {
        mapPages.set(page.classList[0], page);
    });
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
}



function onHomePage() {
    listenToSwipes();
}

function onCubeSelectPage() {
    listenToSwipes();
}

function offListeners() {
    unlistenToSwipes();
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
    // console.log("SWIPED RIGHT");
    switch (activePageName) {
        case "home-page":
            exitApp();
            break;
        case "cube-select-page":
            changePage(mapPages.get("home-page"));
            break;
        default:
            console.log("No pg to redirect");
    }
}
    
function onSwipeLeft() {
    switch (activePageName) {
        case "home-page":
            changePage(mapPages.get("cube-select-page"));
            break;

        default:
            console.log("No pg to redirect");
    }
}


function changePage(pageToActivate) {
    activePage.classList.remove("active");
    pageToActivate.classList.add("active");
    findActivePage();
    console.log(activePageName);
}

function onBackButton() {
    switch(activePageName) {
        case "home-page":
            exitApp();
            break;
        case "cube-select-page":
            changePage(mapPages.get("home-page"));
            break;
    }
}

// /* TODO:
// - Find a way to go back to prev page when clicking phones back button
// Lagay prompt when swipe left from home