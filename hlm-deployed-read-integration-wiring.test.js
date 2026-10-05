'use strict';
const assert=require('assert');
const fs=require('fs');
const html=fs.readFileSync('app.html','utf8');

const bridge='<script src="./hlm-front-office-state-source-browser.js"></script>';
assert(html.includes(bridge));
assert(html.includes('window.HFMFrontOfficeStateSource.install({storage:window.localStorage})'));
assert(html.indexOf(bridge) < html.indexOf('window.HFMFrontOfficeStateSource.install'));
assert(html.indexOf('window.HFMFrontOfficeStateSource.install') > html.indexOf('await initDB();'));
assert(!html.includes('frontOfficeStateSource.selectGameState'));
assert(!html.includes('gameStateReadEnabled:true'));
console.log('Deployed Front Office read integration wiring tests passed.');
