'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('./hlm-phase11-m1639-browser-d1-bridge');
test('default off and no browser-controlled CPU evidence',async()=>{
 const db={prepare(){throw Error('must not touch D1')}};
 const fixture={slot:'s'};
 const handle=createHandler({db,fixture});
 assert.equal((await handle({method:'POST',path:'/decision',body:{action:'approve'}})).body.code,'disabled-by-default');
});
test('decline is no-save even with enabled fixture',async()=>{
 const db={prepare(){throw Error('must not touch D1')}};
 const handle=createHandler({db,fixture:{slot:'s'},enabled:true});
 assert.equal((await handle({method:'POST',path:'/decision',body:{action:'decline'}})).body.saved,false);
});

test('real local D1 HTTP handler rejects rollback, replay, stale and mismatched evidence',async t=>{
 const {Miniflare}=require('miniflare'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {createGameStateEnvelope}=require('./hlm-game-state');
 const local=require('./hlm-phase11-m1637-local-atomic-trade');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m1639-node-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture")}}',d1Databases:{DB:'test-db'},d1Persist:path.join(dir,'d1')});
 t.after(()=>mf.dispose());
 const db=await mf.getD1Database('DB');
 const state=createGameStateEnvelope({meta:{controlledTeamId:'BUF'},teams:[{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'NYR'}],contracts:[{playerId:'p1',teamId:'BUF',aav:3000000}],finances:{buf:{teamId:'BUF',seasonId:2026,payroll:10000000,capLimit:20000000},nyr:{teamId:'NYR',seasonId:2026,payroll:12000000,capLimit:20000000}}});
 const input={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},{fromTeamId:'NYR',toTeamId:'BUF',assets:[{type:'draft-pick',id:'d1',ownerTeamId:'NYR'}]}],playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true,transactionId:'tx-1639-node'};
 await local.initialize(db,'s','r1',state);
 const fixture={slot:'s',expectedRevision:'r1',nextRevision:'r2',teamId:'BUF',input,decisionId:'d1639',cpuFixtureDecision:'accept'};
 const handle=createHandler({db,fixture,enabled:true});
 const review=(await handle({method:'GET',path:'/review'})).body;
 assert.equal(review.ok,true);
 const request={method:'POST',path:'/decision',body:{action:'approve',revision:'r1',proposalDigest:review.proposalDigest}};
 assert.equal((await handle({...request,body:{...request.body,proposalDigest:'tampered'}})).body.saved,false);
 assert.equal((await handle({...request,body:{...request.body,revision:'stale'}})).body.saved,false);
 assert.equal((await handle({...request,body:{action:'decline'}})).body.saved,false);
 assert.equal((await local.read(db,'s')).revision,'r1');
 await db.prepare("CREATE TRIGGER m1639_failure BEFORE UPDATE ON m1637_isolated_state BEGIN SELECT RAISE(ABORT,'forced rollback'); END").run();
 assert.equal((await handle(request)).body.saved,false);
 assert.equal((await local.read(db,'s')).revision,'r1');
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,0);
 await db.prepare('DROP TRIGGER m1639_failure').run();
 assert.equal((await handle(request)).body.saved,true);
 assert.equal((await handle(request)).body.saved,false);
 assert.equal((await local.read(db,'s')).revision,'r2');
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,1);
});
