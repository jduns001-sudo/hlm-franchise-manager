'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const adapter=fs.readFileSync('hlm-phase11-indexeddb-backup.js','utf8');
const origin='https://phase11-isolated-test.invalid/';
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){
 await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated Phase 11 IndexedDB Test</title>'}));
 await page.goto(origin);
 await page.addScriptTag({content:'window.phase11Backup=(function(){const module={exports:{}};'+adapter+';return module.exports})()'});
 await page.evaluate(async()=>{await new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{r.result.close();resolve()};r.onerror=()=>reject(r.error)})});
}
async function write(page,value){await page.evaluate(value=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(value,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),value)}
test('real IndexedDB captures full save, rejects unauthorized restore and restores exactly',async({page})=>{
 await setup(page);
 const original={schema:7,settings:{controlledTeamId:42},customPlayers:[{id:7,name:'Test Prospect'}],contracts:[{playerId:7}],history:[{season:2026}]};
 await write(page,original);
 const snapshot=await page.evaluate(()=>window.phase11Backup.capture(indexedDB));
 expect(snapshot.state).toEqual(original);
 await write(page,{schema:7,settings:{controlledTeamId:99}});
 const unauthorized=await page.evaluate(async s=>{try{await window.phase11Backup.restore(indexedDB,s,false);return 'unexpected success'}catch(e){return e.message}},snapshot);
 expect(unauthorized).toMatch(/authorization/);
 expect((await page.evaluate(()=>window.phase11Backup.capture(indexedDB))).state.settings.controlledTeamId).toBe(99);
 await page.evaluate(s=>window.phase11Backup.restore(indexedDB,s,true),snapshot);
 expect((await page.evaluate(()=>window.phase11Backup.capture(indexedDB))).state).toEqual(original);
});
test('real IndexedDB missing record snapshot restores absence',async({page})=>{
 await setup(page);
 const empty=await page.evaluate(()=>window.phase11Backup.capture(indexedDB));
 expect(empty.existed).toBe(false);
 await write(page,{schema:7,settings:{controlledTeamId:1}});
 await page.evaluate(s=>window.phase11Backup.restore(indexedDB,s,true),empty);
 expect((await page.evaluate(()=>window.phase11Backup.capture(indexedDB))).existed).toBe(false);
});
test('invalid snapshot cannot overwrite live state',async({page})=>{
 await setup(page);
 await write(page,{schema:7,settings:{controlledTeamId:5}});
 const before=await page.evaluate(()=>window.phase11Backup.capture(indexedDB));
 const result=await page.evaluate(async s=>{try{await window.phase11Backup.restore(indexedDB,{...s,database:'wrong'},true);return false}catch(e){return true}},before);
 expect(result).toBe(true);
 expect(await page.evaluate(()=>window.phase11Backup.capture(indexedDB))).toEqual(before);
});
test('aborted real IndexedDB write leaves previous record intact',async({page})=>{
 await setup(page);
 await write(page,{schema:7,settings:{controlledTeamId:10}});
 const value=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('hlm_front_office_v8');
  r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put({schema:7,settings:{controlledTeamId:999}},'db');tx.abort();tx.onabort=()=>{db.close();resolve('aborted')};tx.onerror=()=>reject(tx.error)};
  r.onerror=()=>reject(r.error);
 }));
 expect(value).toBe('aborted');
 expect((await page.evaluate(()=>window.phase11Backup.capture(indexedDB))).state.settings.controlledTeamId).toBe(10);
});
