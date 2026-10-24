'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const modules=new Map();
function collect(name){if(modules.has(name))return;const code=fs.readFileSync(path.join(__dirname,name+'.js'),'utf8');modules.set(name,code);for(const m of code.matchAll(/require\(['"]\.\/([^'"]+)['"]\)/g))collect(m[1].replace(/\.js$/,''))}
collect('hlm-phase11-m1566-persisted-trade-review-host');
const bundle='(function(root){const mods=Object.create(null),cache=Object.create(null);function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(key===\'node:crypto\')return {createHash(){throw Error(\'node-crypto-unavailable\')},timingSafeEqual(){throw Error(\'node-crypto-unavailable\')}};if(!mods[key])throw Error(\'missing \'+key);if(!cache[key]){const m={exports:{}};cache[key]=m;mods[key](m,m.exports,require)}return cache[key].exports;}'+[...modules].map(([n,code])=>'mods['+JSON.stringify(n)+']=function(module,exports,require){\n'+code+'\n};').join('\n')+'root.M1566=require(\'./hlm-phase11-m1566-persisted-trade-review-host\');root.Store=require(\'./hlm-phase11-m1516-atomic-isolated-state-persistence\');})(globalThis)';
function source(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1524-gm-trade-review.html'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle});
  await page.locator('#outgoing').fill('pA');await page.locator('#incoming').fill('pB');await page.locator('#review').click();
  assert.match(await page.locator('#status').innerText(),/No source-backed review host/);
  const seed=await page.evaluate(async state=>{
   localStorage.setItem('hlm_front_office_v8','untouched');
   window.options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:'hlm-phase11-m1566-experimental-mobile'};
   const result=await Store.commit({experimentalEnabled:true,syntheticTestAuthorization:true,gmApproved:true,expectedRevision:0,candidateState:state,eventId:'seed'},options.experimentalDatabaseName);
   window.HLMTradeReviewHost=M1566.createHost(options);return result;
  },source());assert.equal(seed.saved,true);
  const before=await page.evaluate(()=>Store.read(options.experimentalDatabaseName));
  await page.locator('#review').click();await page.locator('#approve').check();await page.locator('#decline').click();
  assert.deepEqual(await page.evaluate(()=>Store.read(options.experimentalDatabaseName)),before);
  const staleTab=await context.newPage();await staleTab.goto(page.url());await staleTab.addScriptTag({content:bundle});
  await staleTab.evaluate(()=>{window.HLMTradeReviewHost=M1566.createHost({experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:'hlm-phase11-m1566-experimental-mobile'})});
  await staleTab.locator('#outgoing').fill('pA');await staleTab.locator('#incoming').fill('pB');
  await staleTab.locator('#review').click();await staleTab.locator('#approve').check();
  await page.locator('#review').click();await page.locator('#approve').check();await page.locator('#submit').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Experimental synthetic transaction saved'));
  assert.equal(await page.locator('#decline').isEnabled(),true);
  assert.equal(await page.locator('#submit').isDisabled(),true);
  const stored=await page.evaluate(()=>Store.read(options.experimentalDatabaseName));
  assert.equal(stored.game.meta.revision,2);assert.equal(stored.ledger.events.length,2);
  assert.equal(stored.game.universe.players[0].teamId,'B');assert.equal(stored.game.universe.players[1].teamId,'A');
  assert.equal(stored.game.assets.contracts[0].teamId,'B');assert.equal(stored.game.assets.contracts[1].teamId,'A');
  await staleTab.locator('#submit').click();
  await staleTab.waitForFunction(()=>document.getElementById('status').textContent.includes('Settlement blocked'));
  assert.deepEqual(await page.evaluate(()=>Store.read(options.experimentalDatabaseName)),stored,'stale tab cannot write');
  await page.reload();await page.addScriptTag({content:bundle});
  const resumed=await page.evaluate(async()=>{
   window.HLMTradeReviewHost=M1566.createHost({experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:'hlm-phase11-m1566-experimental-mobile'});
   return {stored:await Store.read('hlm-phase11-m1566-experimental-mobile'),production:localStorage.getItem('hlm_front_office_v8'),keys:Object.keys(localStorage)};
  });
  assert.deepEqual(resumed.stored,stored);assert.equal(resumed.production,'untouched');assert.deepEqual(resumed.keys,['hlm_front_office_v8']);
  await page.locator('#outgoing').fill('pB');await page.locator('#incoming').fill('pA');await page.locator('#review').click();
  await page.waitForFunction(()=>document.getElementById('summary').textContent.includes('cpu-policy-declined'));
  assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#decline').click();
  assert.deepEqual(await page.evaluate(()=>Store.read('hlm-phase11-m1566-experimental-mobile')),stored);
  console.log('M1566 real GM page: persisted review, decline no-save, approved synthetic settlement, two-tab stale rejection, reload and production isolation passed');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
