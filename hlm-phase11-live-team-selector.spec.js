'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-team-selector.invalid/';
const html=fs.readFileSync('phase11-live-team-selector.html','utf8');
const js=fs.readFileSync('hlm-phase11-live-team-selector.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844}});
test('reads actual-format U.teams and base player IDs without any IndexedDB writes',async({page})=>{
 await page.route(origin+'hlm-universe.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({teams:[{id:42,name:'Pittsburgh'},{id:43,name:'Other'}],players:[{id:7},{id:8}]})}));
 await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:html.replace('<script src="./hlm-phase11-live-team-selector.js"></script>','<script>'+js+'</script>')}));
 await page.goto(origin);
 await page.evaluate(()=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify({universe:{teams:[{id:1,name:'A'}],players:[{id:7},{id:9}]}})));
 await page.click('#inspect');await expect(page.locator('#result')).toContainText('"basePlayerIdCollisions": [');
 await expect(page.locator('#result')).toContainText('"automaticCutoverAllowed": false');
 const dbs=await page.evaluate(()=>indexedDB.databases());expect(dbs.some(x=>x.name==='hlm_front_office_v8')).toBe(false);
});
