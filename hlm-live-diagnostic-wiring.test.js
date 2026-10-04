'use strict';
const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('app.html','utf8');

assert(html.includes('<script src="./hlm-phase2-browser-diagnostic.js"></script>'));
assert(html.includes('<script src="./hlm-front-office-live-diagnostic.js"></script>'));
assert(html.includes('window.HFMFrontOfficeDiagnostic.install(()=>Promise.resolve(db))'));
assert(html.indexOf('hlm-phase2-browser-diagnostic.js') < html.indexOf('hlm-front-office-live-diagnostic.js'));
assert(html.indexOf('window.HFMFrontOfficeDiagnostic.install') > html.indexOf('await initDB();'));
assert(!html.includes('HFMFrontOfficeDiagnostic.install(()=>writeState'));
console.log('Live read-only diagnostic wiring tests passed.');
