'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Miniflare}=require('miniflare');
const {createGameStateEnvelope}=require('./hlm-game-state');
const local=require('./hlm-phase11-m1637-local-atomic-trade');
const evidence=require('./hlm-phase11-m1638-local-trade-evidence');
const state=()=>createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'NYR'}],contracts:[{playerId:'p1',teamId:'BUF',aav:3000000}],finances:{buf:{teamId:'BUF',seasonId:2026,payroll:10000000,capLimit:20000000},nyr:{teamId:'NYR',seasonId:2026,payroll:12000000,capLimit:20000000}}});
const input={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},{fromTeamId:'NYR',toTeamId:'BUF',assets:[{type:'draft-pick',id:'d1',ownerTeamId:'NYR'}]}],playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true,transactionId:'tx-1638'};
async function open(dir){const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture")}}',d1Databases:{DB:'test-db'},d1Persist:path.join(dir,'d1')});return {mf,db:await mf.getD1Database('DB')}}
test('source-backed local digest, decision binding, rollback, replay and restart',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m1638-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let x=await open(dir);
 try{
  await local.initialize(x.db,'slot','r1',state());
  const review=await evidence.review(x.db,{slot:'slot',expectedRevision:'r1',teamId:'BUF',input});
  assert.equal(review.ok,true);
  assert.match(review.proposalDigest,/^[0-9a-f]{64}$/);
  const same=await evidence.review(x.db,{slot:'slot',expectedRevision:'r1',teamId:'BUF',input:JSON.parse(JSON.stringify(input))});
  assert.equal(same.proposalDigest,review.proposalDigest);
  const binding={proposalDigest:review.proposalDigest,slot:'slot',revision:'r1',teamId:'BUF'};
  const req={localTestFixture:true,gmAction:'approve',cpuFixtureDecision:'accept',slot:'slot',expectedRevision:'r1',nextRevision:'r2',decisionId:'d-1638',proposalDigest:review.proposalDigest,teamId:'BUF',input,gmReview:{...binding,approved:true},cpuFixtureEvidence:{...binding,decisionId:'d-1638',decision:'accept'}};
  const baseline=JSON.stringify(await local.read(x.db,'slot'));
  const rejected=[
   {...req,localTestFixture:false},
   {...req,gmAction:'cancel'},
   {...req,gmAction:'decline'},
   {...req,cpuFixtureDecision:'decline'},
   {...req,proposalDigest:'incorrect'},
   {...req,gmReview:{...req.gmReview,proposalDigest:'incorrect'}},
   {...req,cpuFixtureEvidence:{...req.cpuFixtureEvidence,revision:'r0'}},
   {...req,cpuFixtureEvidence:{...req.cpuFixtureEvidence,decisionId:'wrong'}},
   {...req,input:{...input,transactionId:'altered'}},
   {...req,input:{...input,legs:[{...input.legs[0],assets:[{type:'player',id:'altered',ownerTeamId:'BUF'}]},input.legs[1]]}},
   {...req,expectedRevision:'stale'},
   {...req,gmReview:{...req.gmReview,approved:false}}
  ];
  for(const bad of rejected)assert.equal((await evidence.settle(x.db,bad)).saved,false);
  assert.equal(JSON.stringify(await local.read(x.db,'slot')),baseline);
  assert.equal((await x.db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,0);
  const concurrent=await Promise.all(Array.from({length:4},()=>evidence.settle(x.db,req)));
  assert.equal(concurrent.filter(r=>r.saved).length,1);
  assert.equal(concurrent.find(r=>r.saved).settlementAuthorized,false);
  const saved=await local.read(x.db,'slot');
  assert.equal(saved.revision,'r2');
  assert.equal(saved.state.universe.players.find(p=>p.id==='p1').teamId,'NYR');
  assert.equal(saved.state.assets.contracts.find(c=>c.playerId==='p1').teamId,'NYR');
  assert.equal(saved.state.finances.buf.payroll,7000000);
  assert.equal(saved.state.finances.nyr.payroll,15000000);
  assert.equal((await x.db.prepare('SELECT proposal_digest FROM m1637_consumed_decisions WHERE decision_id=?').bind('d-1638').first()).proposal_digest,review.proposalDigest);
  assert.equal((await evidence.settle(x.db,req)).saved,false);
  await local.initialize(x.db,'rollback','r1',state());
  const r2=await evidence.review(x.db,{slot:'rollback',expectedRevision:'r1',teamId:'BUF',input});
  const bound={proposalDigest:r2.proposalDigest,slot:'rollback',revision:'r1',teamId:'BUF'};
  await x.db.prepare("CREATE TRIGGER m1638_forced_failure BEFORE UPDATE ON m1637_isolated_state BEGIN SELECT RAISE(ABORT,'forced rollback'); END").run();
  const failed=await evidence.settle(x.db,{...req,slot:'rollback',decisionId:'d-rollback',proposalDigest:r2.proposalDigest,gmReview:{...bound,approved:true},cpuFixtureEvidence:{...bound,decision:'accept',decisionId:'d-rollback'}});
  assert.equal(failed.saved,false);
  assert.equal((await local.read(x.db,'rollback')).revision,'r1');
  assert.equal((await x.db.prepare("SELECT COUNT(*) AS n FROM m1637_consumed_decisions WHERE decision_id='d-rollback'").first()).n,0);
 }finally{await x.mf.dispose()}
 x=await open(dir);
 try{assert.equal((await local.read(x.db,'slot')).revision,'r2');assert.equal((await x.db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,1)}
 finally{await x.mf.dispose()}
});
