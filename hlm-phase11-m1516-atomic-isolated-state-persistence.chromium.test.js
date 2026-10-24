'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const game=fs.readFileSync(path.join(__dirname,'hlm-game-state.js'),'utf8');
 const atomic=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1516-atomic-isolated-state-persistence.js'),'utf8');
 const html='<script>var module={exports:{}};'+game+
 ';window.HLMGameState=module.exports;module={exports:{}};var require=function(name){if(name==="./hlm-game-state")return window.HLMGameState;throw Error("unknown dependency")};'+atomic+
 ';window.HLMAtomic=module.exports;</script>';
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
  const url='http://127.0.0.1:'+server.address().port;
  await Promise.all([a.goto(url),b.goto(url)]);
  const name='hlm-m1516-test-'+process.pid;
  const state={schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},
   universe:{players:[{id:'a',teamId:'B'},{id:'b',teamId:'A'}],
    teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
   assets:{contracts:[{playerId:'a',teamId:'B'},{playerId:'b',teamId:'A'}],draftPicks:[]},
   activity:{transactions:[],games:[],injuries:[]},
   history:{seasons:[],statistics:[],records:[]},finances:{},extensions:{}};
  const input={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
   expectedRevision:0,candidateState:state,eventId:'synthetic-one'};
  const initial=await a.evaluate(name=>HLMAtomic.read(name),name);
  assert.equal(initial.game,null);assert.equal(initial.ledger,null);
  const cancel=await a.evaluate(([i,n])=>HLMAtomic.commit({...i,cancelled:true},n),[input,name]);
  assert.equal(cancel.committed,false);
  assert.deepEqual(await a.evaluate(name=>HLMAtomic.read(name),name),initial);
  const race=await Promise.all([
   a.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name]),
   b.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name])]);
  assert.equal(race.filter(x=>x.committed).length,1,'exactly one concurrent writer');
  await a.reload();
  const saved=await a.evaluate(name=>HLMAtomic.read(name),name);
  assert.equal(saved.game.meta.revision,1);
  assert.equal(saved.game.universe.players[0].teamId,'B');
  assert.equal(saved.game.assets.contracts[0].teamId,'B');
  assert.equal(saved.ledger.revision,1);
  assert.deepEqual(saved.ledger.events,[{id:'synthetic-one',experimental:true}]);
  const replay=await b.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name]);
  assert.equal(replay.committed,false);
  const real=await b.evaluate(([i,n])=>HLMAtomic.commit({...i,realTradeSettlement:true},n),[input,name]);
  assert.equal(real.committed,false);
  assert.deepEqual(await b.evaluate(name=>HLMAtomic.read(name),name),saved);
  await context.close();
  console.log('M1516 browser atomic GameState+ledger, reload, concurrent stale-write, replay, cancel and real settlement denial passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
