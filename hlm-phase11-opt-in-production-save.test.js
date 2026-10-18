'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('app.html','utf8');
test('guarded production save remains disabled unless explicitly opted in',()=>{
 assert.match(app,/window\.HLM_PHASE11_SAVE_GUARD_OPT_IN!==true/);
 assert.match(app,/phase11ExpectedState===null\)throw Error/);
 assert.match(app,/HLMPhase11AtomicCutover\.guardedSave\(indexedDB,phase11ExpectedState,next\)/);
});
test('legacy saves retain schema and identity fields',()=>{
 for(const key of ['customPlayers','playerOverrides','draftPickOverrides','extraDraftPicks','transactions','lines','depth','contracts']) assert.match(app,new RegExp(key));
 assert.match(app,/function readState\(\)/);
 assert.match(app,/function writeState\(state\)/);
});
test('no automatic guard activation in production HTML',()=>{
 assert.doesNotMatch(app,/HLM_PHASE11_SAVE_GUARD_OPT_IN\s*=\s*true/);
});
