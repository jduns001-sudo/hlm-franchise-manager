'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
test('published mobile Front Office renders actual player positions, OVR, team roster and prospects',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 try{
  const response=await page.goto(origin+'app.html',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response?.status()).toBe(200);
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
  const sample=await page.evaluate(()=>{
   const active=db.players.filter(p=>!p.retired);
   const team=db.teams.find(t=>active.some(p=>p.teamId==t.id));
   const roster=active.filter(p=>p.teamId==team?.id).sort((a,b)=>Number(b.ovr||0)-Number(a.ovr||0));
   const prospect=active.filter(p=>p.age<=23&&Number(p.potentialMax||p.potential||0)>=80).sort((a,b)=>Number(b.potentialMax||b.potential||0)-Number(a.potentialMax||a.potential||0))[0];
   return {teamId:team?.id,player:roster[0]&&{name:roster[0].name,position:(roster[0].positions?.length?roster[0].positions:[roster[0].position]).join('/'),ovr:String(roster[0].ovr)},prospect:prospect&&{name:prospect.name,ovr:String(prospect.ovr)}};
  });
  expect(sample.teamId).toBeTruthy();
  expect(sample.player?.name).toBeTruthy();
  expect(sample.player?.position).toMatch(/^(C|LW|RW|LD|RD|G)(\/(C|LW|RW|LD|RD|G))*$/);
  expect(Number(sample.player?.ovr)).toBeGreaterThan(0);
  const nav=async label=>{await page.locator('#nav button').filter({hasText:new RegExp('^'+label+'$')}).first().click()};
  await nav('Team Rosters');
  await page.locator('#trteam').selectOption(String(sample.teamId));
  const row=page.locator('#trout tbody tr').filter({has:page.locator('td').filter({hasText:sample.player.name})}).first();
  await expect(row).toBeVisible();
  await expect(row.locator('td').nth(1)).toHaveText(sample.player.position);
  await expect(row.locator('td').nth(3)).toHaveText(sample.player.ovr);
  await nav('Players');
  const playerRow=page.locator('#playerTable tbody tr').filter({has:page.locator('td').filter({hasText:sample.player.name})}).first();
  // Search narrows large leagues to the selected real player.
  await page.locator('#psearch').fill(sample.player.name);
  await expect(playerRow).toBeVisible();
  await expect(playerRow.locator('td').nth(2)).toHaveText(sample.player.position);
  await expect(playerRow.locator('td').nth(4)).toHaveText(sample.player.ovr);
  if(sample.prospect){
   await nav('Prospects');
   const prospectRow=page.locator('#view tbody tr').filter({has:page.locator('td').filter({hasText:sample.prospect.name})}).first();
   await expect(prospectRow).toBeVisible();
   await expect(prospectRow.locator('td').nth(3)).toHaveText(sample.prospect.ovr);
  }
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: live league player position and OVR, selected team roster and prospect rendering matched in-memory universe');
 }finally{await context.close()}
});
