'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const adapter=fs.readFileSync('hlm-phase11-interrupted-recovery.js','utf8');
const origin='https://phase11-recovery-isolated.invalid/';
test.use({browserName:'chromium',viewport:{width:390,height:844}});
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[{id:7,name:'Prospect'}],contracts:[{playerId:7}],history:[{season:2026}]};
const candidate={...original,customPlayers:[{id:7,name:'Updated Prospect'}]};
async function load(page){await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated Recovery Test</title>'}));await page.goto(origin);await page.addScriptTag({content:'window.recovery=(function(){const module={exports:{}};'+adapter+';return module.exports})()'})}
async function state(page){return page.evaluate(async()=>{const a=window.recovery;return {live:await a.read(indexedDB,a.LIVE),staged:await a.read(indexedDB,a.STAGED),journal:await a.read(indexedDB,a.JOURNAL)}})}
test('before staging interruption leaves franchise unchanged after reload',async({page})=>{
 await load(page);await page.evaluate(v=>window.recovery.initialize(indexedDB,v),original);
 await page.reload();await page.addScriptTag({content:'window.recovery=(function(){const module={exports:{}};'+adapter+';return module.exports})()'});
 expect(await page.evaluate(()=>window.recovery.recover(indexedDB))).toBe('clean');
 expect((await state(page)).live).toEqual(original);
});
test('after staging reload rolls back and repeated recovery is idempotent',async({page})=>{
 await load(page);await page.evaluate(v=>window.recovery.initialize(indexedDB,v),original);
 await page.evaluate(v=>window.recovery.begin(indexedDB,v,true),candidate);
 expect((await state(page)).staged).toEqual(candidate);
 await page.reload();await page.addScriptTag({content:'window.recovery=(function(){const module={exports:{}};'+adapter+';return module.exports})()'});
 expect(await page.evaluate(()=>window.recovery.recover(indexedDB))).toBe('rolled-back');
 expect(await page.evaluate(()=>window.recovery.recover(indexedDB))).toBe('clean');
 expect(await state(page)).toEqual({live:original,staged:undefined,journal:undefined});
});
test('after write interruption reload restores original and controlled team',async({page})=>{
 await load(page);await page.evaluate(v=>window.recovery.initialize(indexedDB,v),original);
 await page.evaluate(v=>window.recovery.begin(indexedDB,v,true),candidate);
 await page.evaluate(()=>window.recovery.commit(indexedDB));
 expect((await state(page)).live.customPlayers[0].name).toBe('Updated Prospect');
 await page.reload();await page.addScriptTag({content:'window.recovery=(function(){const module={exports:{}};'+adapter+';return module.exports})()'});
 expect(await page.evaluate(()=>window.recovery.recover(indexedDB))).toBe('rolled-back');
 expect((await state(page)).live).toEqual(original);
 expect((await state(page)).live.settings.controlledTeamId).toBe(42);
});
test('authorization and controlled team mismatch cannot stage candidate',async({page})=>{
 await load(page);await page.evaluate(v=>window.recovery.initialize(indexedDB,v),original);
 const result=await page.evaluate(async v=>{try{await window.recovery.begin(indexedDB,v,false);return 'unexpected'}catch(e){return e.message}},candidate);
 expect(result).toMatch(/authorization/);
 const mismatch=await page.evaluate(async v=>{try{await window.recovery.begin(indexedDB,v,true);return 'unexpected'}catch(e){return e.message}},{...candidate,settings:{controlledTeamId:99}});
 expect(mismatch).toMatch(/Controlled team/);
 expect(await state(page)).toEqual({live:original,staged:undefined,journal:undefined});
});
