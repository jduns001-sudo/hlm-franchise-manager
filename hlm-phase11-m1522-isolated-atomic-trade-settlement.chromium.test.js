'use strict';
/* Browser acceptance of the source-backed transaction contract and atomic
 * experimental persistence. Does not invoke the Node-only M1522 facade. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {prepareTransaction}=require('./hlm-phase11-m1521-atomic-trade-transaction-contract');
function source(){return {schemaVersion:1,meta:{revision:0,controlledTeamId:'A'},
 universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},
 assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},
 activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},
 finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}};}
(async()=>{
 const original=source(),trade={outgoingPlayerId:'pA',incomingPlayerId:'pB'};
 const opts={experimentalEnabled:true,gmApproved:true,expectedGameRevision:0,eventId:'m1522_trade_1'};
 const reviewed=prepareTransaction(original,trade,opts);
 assert.equal(reviewed.ok,true,reviewed.code);
 assert.equal(reviewed.saved,false);assert.equal(reviewed.settlementAuthorized,false);
 assert.equal(reviewed.candidateState.universe.players[0].teamId,'B');
 assert.equal(reviewed.candidateState.assets.contracts[0].teamId,'B');
 assert.equal(prepareTransaction(original,trade,{...opts,cancelled:true}).ok,false);
 const game=fs.readFileSync(path.join(__dirname,'hlm-game-state.js'),'utf8');
 const atomic=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1516-atomic-isolated-state-persistence.js'),'utf8');
 const html='<script>(function(){var module={exports:{}};'+game+
 ';window.HLMGameState=module.exports;})();(function(){var module={exports:{}};var require=function(name){if(name==="./hlm-game-state")return window.HLMGameState;throw Error("unknown dependency")};'+atomic+
 ';window.HLMAtomic=module.exports;})();</script>';
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const a=await context.newPage(),b=await context.newPage(),url='http://127.0.0.1:'+server.address().port;
  await Promise.all([a.goto(url),b.goto(url)]);
  const name='hlm-m1522-trade-'+process.pid;
  const input={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
   expectedRevision:reviewed.expectedRevision,candidateState:reviewed.candidateState,eventId:reviewed.eventId};
  const empty=await a.evaluate(name=>HLMAtomic.read(name),name);
  assert.equal(empty.game,null);
  const cancelled=await a.evaluate(([i,n])=>HLMAtomic.commit({...i,cancelled:true},n),[input,name]);
  assert.equal(cancelled.saved,false);
  assert.deepEqual(await a.evaluate(name=>HLMAtomic.read(name),name),empty);
  const concurrent=await Promise.all([
   a.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name]),
   b.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name])
  ]);
  assert.equal(concurrent.filter(x=>x.committed).length,1);
  await a.reload();
  const saved=await a.evaluate(name=>HLMAtomic.read(name),name);
  assert.equal(saved.game.meta.revision,1);
  assert.equal(saved.game.universe.players.find(x=>x.id==='pA').teamId,'B');
  assert.equal(saved.game.universe.players.find(x=>x.id==='pB').teamId,'A');
  assert.equal(saved.game.assets.contracts.find(x=>x.playerId==='pA').teamId,'B');
  assert.equal(saved.game.assets.contracts.find(x=>x.playerId==='pB').teamId,'A');
  assert.equal(saved.ledger.events.length,1);
  assert.equal(saved.ledger.events[0].id,input.eventId);
  const replay=await b.evaluate(([i,n])=>HLMAtomic.commit(i,n),[input,name]);
  assert.equal(replay.committed,false);
  const forbidden=await b.evaluate(([i,n])=>HLMAtomic.commit({...i,realTradeSettlement:true},n),[input,name]);
  assert.equal(forbidden.committed,false);
  assert.deepEqual(await b.evaluate(name=>HLMAtomic.read(name),name),saved);
  await context.close();
  console.log('M1522 source-reviewed trade candidate -> atomic isolated browser store, two-tab race, reload, replay, cancellation and production denial passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
