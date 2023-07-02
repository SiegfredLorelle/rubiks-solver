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
    document.getElementById('deviceready').classList.add('ready');

    findActivePage();
}


let activePage;

let touchStartX = 0;
let touchEndX = 0;


/* FOR TESTING ON WEB, USE ON DEVICE READY ON MOBILE APPS */
function onStart() {
    findActivePage();
}
onStart();


/* Home Page */
function findActivePage() {
    activePage = document.querySelector("main > *");
    activePage = activePage.classList[0] 
    // console.log(activePage.classList[0]);


    if (activePage === "home-page") {
        onHomePage();
        // console.log("GUMANA BA?");
    };
}

function onHomePage() {
    // Listen to swipes left and right swipes
    // console.log("GUMANA BA?");
    listenToSwipes();
}

function listenToSwipes() {
    touchStartX = 0;
    touchEndX = 0;

    addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        // console.log(`start: ${e.changedTouches[0].screenX}`);
    })
    addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        // console.log(`end: ${e.changedTouches[0].screenX}`);
        checkIfSwipe();
    })
}

function checkIfSwipe() {
    let distance = Math.abs(touchStartX - touchEndX)
    const MIN_SWIPE_DISTANCE = 50;

    if (distance >= MIN_SWIPE_DISTANCE) {
        // console.log("SWIPED");
        checkSwipeDirection();
    }

    console.log(distance);
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
    console.log("SWIPED RIGHT");
}

function onSwipeLeft() {
    console.log("SWIPED Left");
}