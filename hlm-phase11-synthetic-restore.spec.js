'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
test('synthetic franchise backup import persists player metadata and team assignment across mobile reload',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 const synthetic={id:9901034,name:'Synthetic Phase11 Test Skater',age:19,position:'C',positions:['C','RW'],ovr:83,potential:94,potentialMin:90,potentialMax:96,potentialLabel:'Elite',type:'Playmaker',aav:0,retired:false};
 try{
  const response=await page.goto(origin+'app.html',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response?.status()).toBe(200);
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  const backup=await page.evaluate(player=>{
   const team=db.teams.find(t=>t.id!=null);
   if(!team)throw Error('No team in published universe');
   return {...compactState(),settings:{...db.settings,controlledTeamId:team.id},customPlayers:[...compactState().customPlayers,{...player,teamId:team.id}],testTeamId:team.id};
  },synthetic);
  const teamId=backup.testTeamId;
  delete backup.testTeamId;
  expect(backup.customPlayers.some(p=>p.id===synthetic.id)).toBe(true);
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
  const alert=page.waitForEvent('dialog');
  await page.locator('#nav button').filter({hasText:/^Import \/ Export$/}).click();
  await page.locator('#view input[type=file]').setInputFiles({
   name:'synthetic-phase11-test-backup.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(backup),'utf8')
  });
  const dialog=await alert;
  expect(dialog.message()).toBe('Backup restored.');
  await dialog.accept();
  await expect.poll(()=>page.evaluate(id=>db.players.some(p=>p.id===id),synthetic.id)).toBe(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  const saved=await page.evaluate(id=>{
   const p=db.players.find(x=>x.id===id);
   return p&&{name:p.name,positions:p.positions,ovr:p.ovr,potential:p.potential,potentialMin:p.potentialMin,potentialMax:p.potentialMax,potentialLabel:p.potentialLabel,teamId:p.teamId,controlledTeamId:db.settings.controlledTeamId};
  },synthetic.id);
  expect(saved).toMatchObject({name:synthetic.name,positions:synthetic.positions,ovr:synthetic.ovr,potential:synthetic.potential,potentialMin:synthetic.potentialMin,potentialMax:synthetic.potentialMax,potentialLabel:synthetic.potentialLabel,teamId,controlledTeamId:teamId});
  await page.locator('#nav button').filter({hasText:/^Roster$/}).first().click();
  const rosterRow=page.locator('#view tbody tr').filter({hasText:synthetic.name}).first();
  await expect(rosterRow).toBeVisible();
  await expect(rosterRow.locator('td').nth(1)).toHaveText('C/RW');
  await expect(rosterRow.locator('td').nth(3)).toHaveText('83');
  await page.locator('#nav button').filter({hasText:/^Prospects$/}).first().click();
  const prospectRow=page.locator('#view tbody tr').filter({hasText:synthetic.name}).first();
  await expect(prospectRow).toBeVisible();
  await expect(prospectRow.locator('td').nth(3)).toHaveText('83');
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: synthetic imported backup persisted across reload; roster/prospect metadata and team assignment preserved');
 }finally{await context.close()}
});
