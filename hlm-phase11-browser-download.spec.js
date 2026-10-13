'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {FORMAT}=require('./hlm-phase11-indexeddb-backup');
const {packageSnapshot,verifyReopenedFile}=require('./hlm-phase11-durable-file-verify');
const origin='https://phase11-download-isolated.invalid/';
test.use({browserName:'chromium',acceptDownloads:true,viewport:{width:390,height:844}});
async function pageSetup(page){
 await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated Phase 11 Backup Download</title><button id="download">Export backup</button>'}));
 await page.goto(origin);
 await page.evaluate(()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('hlm_front_office_v8',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('state');
  r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put({schema:7,settings:{controlledTeamId:42},customPlayers:[{id:9,name:'Draft Rookie'}],contracts:[{playerId:9,amount:900000}],history:[{season:2026}]},'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};
  r.onerror=()=>reject(r.error);
 }));
}
test('Chromium downloads independently reopened full franchise backup',async({page})=>{
 await pageSetup(page);
 const raw=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readonly'),q=tx.objectStore('state').get('db');q.onsuccess=()=>{const state=q.result;db.close();resolve(state)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));
 const snapshot={format:FORMAT,database:'hlm_front_office_v8',store:'state',record:'db',existed:true,state:raw};
 const contents=packageSnapshot(snapshot);
 await page.evaluate(text=>{document.getElementById('download').onclick=()=>{const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hlm-phase11-verified-franchise-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}},contents);
 const downloadPromise=page.waitForEvent('download');
 await page.click('#download');
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('hlm-phase11-verified-franchise-backup.json');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-browser-download-'));
 try{
  const destination=path.join(dir,'user-downloaded-backup.json');
  await download.saveAs(destination);
  const reopened=fs.readFileSync(destination,'utf8');
  expect(verifyReopenedFile(reopened,snapshot)).toEqual(snapshot);
  expect(JSON.parse(reopened).algorithm).toBe('sha256');
  const corrupted=JSON.parse(reopened);corrupted.payload=corrupted.payload.replace('Draft Rookie','Corrupted Rookie');
  expect(()=>verifyReopenedFile(JSON.stringify(corrupted),snapshot)).toThrow(/integrity/);
  const incompatible=JSON.parse(reopened);incompatible.format='unsupported-future';
  expect(()=>verifyReopenedFile(JSON.stringify(incompatible),snapshot)).toThrow(/Unsupported/);
  expect(()=>verifyReopenedFile(reopened,{...snapshot,state:{schema:7}})).toThrow(/mismatch/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
