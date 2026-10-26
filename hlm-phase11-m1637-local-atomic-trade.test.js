'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Miniflare}=require('miniflare');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {initialize,read,settle}=require('./hlm-phase11-m1637-local-atomic-trade');
const state=()=>createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'NYR'}],contracts:[{playerId:'p1',teamId:'BUF',aav:3000000}],finances:{buf:{teamId:'BUF',seasonId:2026,payroll:10000000,capLimit:20000000},nyr:{teamId:'NYR',seasonId:2026,payroll:12000000,capLimit:20000000}}});
const input={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},{fromTeamId:'NYR',toTeamId:'BUF',assets:[{type:'draft-pick',id:'d1',ownerTeamId:'NYR'}]}],playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true,transactionId:'tx-1637'};
const request={localTestFixture:true,gmAction:'approve',cpuFixtureDecision:'accept',slot:'isolated-only',expectedRevision:'r1',nextRevision:'r2',decisionId:'decision-1',proposalDigest:'test-digest',teamId:'BUF',input};
async function open(dir){const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture")}}',d1Databases:{DB:'test-db'},d1Persist:path.join(dir,'d1')});return {mf,db:await mf.getD1Database('DB')}}
test('atomic local candidate, replay, stale, cancellation, rollback and reload',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m1637-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let x=await open(dir);
 try{
  await initialize(x.db,request.slot,'r1',state());
  const baseline=JSON.stringify((await read(x.db,request.slot)).state);
  for(const gmAction of ['cancel','decline']){
   assert.equal((await settle(x.db,{...request,gmAction})).saved,false);
  }
  assert.equal((await settle(x.db,{...request,localTestFixture:false})).saved,false);
  assert.equal((await settle(x.db,{...request,cpuFixtureDecision:'decline'})).saved,false);
  assert.equal((await settle(x.db,{...request,expectedRevision:'stale'})).saved,false);
  assert.equal(JSON.stringify((await read(x.db,request.slot)).state),baseline);
  const results=await Promise.all(Array.from({length:4},()=>settle(x.db,request)));
  assert.equal(results.filter(r=>r.ok).length,1);
  const saved=await read(x.db,request.slot);
  assert.equal(saved.revision,'r2');
  assert.equal(saved.state.universe.players.find(p=>p.id==='p1').teamId,'NYR');
  assert.equal(saved.state.assets.contracts.find(c=>c.playerId==='p1').teamId,'NYR');
  assert.equal(saved.state.finances.buf.payroll,7000000);
  assert.equal(saved.state.finances.nyr.payroll,15000000);
  assert.equal(saved.state.activity.transactions.find(tx=>tx.id==='tx-1637').humanGMApproved,true);
  assert.equal((await settle(x.db,request)).saved,false);
  const spent=await x.db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first();
  assert.equal(spent.n,1);
  // A database constraint failure in the state update must roll back nonce insertion.
  await x.db.prepare("CREATE TRIGGER m1637_test_failure BEFORE UPDATE ON m1637_isolated_state BEGIN SELECT RAISE(ABORT,'forced rollback'); END").run();
  const failed=await settle(x.db,{...request,expectedRevision:'r2',nextRevision:'r3',decisionId:'decision-rollback',input:{...input,transactionId:'tx-1637-b'}});
  assert.equal(failed.saved,false);
  assert.equal((await x.db.prepare("SELECT COUNT(*) AS n FROM m1637_consumed_decisions WHERE decision_id='decision-rollback'").first()).n,0);
  assert.equal((await read(x.db,request.slot)).revision,'r2');
 }finally{await x.mf.dispose()}
 x=await open(dir);
 try{assert.equal((await read(x.db,request.slot)).revision,'r2');assert.equal((await x.db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,1)}
 finally{await x.mf.dispose()}
});
