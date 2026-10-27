'use strict';
// Mission 1638: local-only D1 failure/recovery regression acceptance.
// No production endpoint, real CPU consent, or browser settlement.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Miniflare}=require('miniflare');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {initialize,read,settle}=require('./hlm-phase11-m1637-local-atomic-trade');
const slot='m1638-local';
const state=()=>createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'NYR'}],contracts:[{playerId:'p1',teamId:'BUF',aav:3000000}],finances:{buf:{teamId:'BUF',seasonId:2026,payroll:10000000,capLimit:20000000},nyr:{teamId:'NYR',seasonId:2026,payroll:12000000,capLimit:20000000}}});
const input={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},{fromTeamId:'NYR',toTeamId:'BUF',assets:[{type:'draft-pick',id:'d1',ownerTeamId:'NYR'}]}],playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true,transactionId:'tx-m1638'};
const req={localTestFixture:true,gmAction:'approve',cpuFixtureDecision:'accept',slot,expectedRevision:'r1',nextRevision:'r2',decisionId:'m1638-decision',proposalDigest:'fixture-digest',teamId:'BUF',input};
async function open(dir){const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local")}}',d1Databases:{DB:'test-db'},d1Persist:path.join(dir,'d1')});return {mf,db:await mf.getD1Database('DB')}}
async function count(db,id){return (await db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions WHERE decision_id=?').bind(id).first()).n}
test('rollback, retry after failure, replay, stale, cancelled and reload remain isolated',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m1638-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let x=await open(dir);
 try{
  await initialize(x.db,slot,'r1',state());
  const before=JSON.stringify(await read(x.db,slot));
  for(const change of [{gmAction:'cancel'},{gmAction:'decline'},{cpuFixtureDecision:'decline'},{localTestFixture:false},{expectedRevision:'r0'},{input:{...input,humanGMApproved:false}}]){
   const denied=await settle(x.db,{...req,...change});
   assert.equal(denied.saved,false);assert.equal(denied.productionTouched,false);
   assert.equal(JSON.stringify(await read(x.db,slot)),before);
   assert.equal(await count(x.db,req.decisionId),0);
  }
  // Abort the second statement of the D1 batch: nonce insert must roll back.
  await x.db.prepare("CREATE TRIGGER m1638_abort BEFORE UPDATE ON m1637_isolated_state BEGIN SELECT RAISE(ABORT,'injected failure'); END").run();
  const failed=await settle(x.db,req);
  assert.equal(failed.saved,false);assert.equal(failed.ok,false);
  assert.equal(JSON.stringify(await read(x.db,slot)),before);
  assert.equal(await count(x.db,req.decisionId),0);
  await x.db.prepare('DROP TRIGGER m1638_abort').run();
  const saved=await settle(x.db,req);
  assert.equal(saved.ok,true);assert.equal(saved.saved,true);
  assert.equal(await count(x.db,req.decisionId),1);
  const committed=JSON.stringify(await read(x.db,slot));
  assert.equal((await settle(x.db,req)).saved,false);
  assert.equal((await settle(x.db,{...req,decisionId:'another-decision'})).saved,false);
  assert.equal(JSON.stringify(await read(x.db,slot)),committed);
 }finally{await x.mf.dispose()}
 x=await open(dir);
 try{
  const persisted=await read(x.db,slot);
  assert.equal(persisted.revision,'r2');
  assert.equal(persisted.state.universe.players.find(p=>p.id==='p1').teamId,'NYR');
  assert.equal(persisted.state.assets.contracts.find(c=>c.playerId==='p1').teamId,'NYR');
  assert.equal(await count(x.db,req.decisionId),1);
  assert.equal((await settle(x.db,req)).saved,false);
 }finally{await x.mf.dispose()}
});
