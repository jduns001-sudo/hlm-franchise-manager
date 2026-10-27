'use strict';
// All contract and prospect-rights records in this test are SYNTHETIC LAB FIXTURES.
// They are not assertions about actual NHL contracts, ownership, or franchise rights.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const {createIsolatedTransactionLab}=require('./hlm-phase11-block-a-isolated-transaction-lab');
function fixture(){
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine);
 const player=state.universe.players.find(p=>p.teamId!=null);
 const pick=state.assets.draftPicks.find(p=>p.status==='AVAILABLE');
 assert.ok(player);assert.ok(pick);
 const from=String(player.teamId),to=String(teams(source).find(t=>String(t.id)!==from).id);
 const pickTo=String(teams(source).find(t=>String(t.id)!==String(pick.currentOwnerId)).id);
 // Synthetic records are intentionally isolated from the authoritative source.
 state.assets.contracts.push({id:'SYNTHETIC-LAB-CONTRACT',playerId:player.id,teamId:player.teamId,status:'active',fixtureOnly:true});
 state.universe.prospects.push({id:'SYNTHETIC-LAB-PROSPECT',rightsTeamId:player.teamId,draftPickId:'SYNTHETIC-LAB-DRAFT-REFERENCE',fixtureOnly:true});
 state.history.seasons.push({season:'SYNTHETIC-LAB-PRIOR-SEASON',fixtureOnly:true});
 const changes={
  players:[{id:player.id,from,to}],
  contracts:[{playerId:player.id,from,to}],
  picks:[{id:pick.pickId,from:String(pick.currentOwnerId),to:pickTo}],
  prospects:[{id:'SYNTHETIC-LAB-PROSPECT',from,to}]
 };
 return {state,changes,playerId:player.id,pickId:pick.pickId,to,pickTo};
}
test('isolated synthetic four-category transaction commits together without touching season archive',()=>{
 const f=fixture(),lab=createIsolatedTransactionLab(f.state),before=lab.snapshot();
 const request={experimentalEnabled:true,gmApproved:true,expectedRevision:'revision-1',decisionId:'synthetic-four-category',changes:f.changes};
 assert.equal(lab.simulate({...request,injectFailure:true}).committed,false);
 assert.deepEqual(lab.snapshot(),before);
 const result=lab.simulate(request);
 assert.equal(result.committed,true);
 assert.equal(result.productionSaved,false);
 assert.equal(result.independentlyAuthenticated,false);
 const after=lab.snapshot();
 assert.equal(String(after.state.universe.players.find(p=>p.id===f.playerId).teamId),f.to);
 assert.equal(String(after.state.assets.contracts.find(c=>c.id==='SYNTHETIC-LAB-CONTRACT').teamId),f.to);
 assert.equal(String(after.state.assets.draftPicks.find(p=>p.pickId===f.pickId).currentOwnerId),f.pickTo);
 assert.equal(String(after.state.universe.prospects.find(p=>p.id==='SYNTHETIC-LAB-PROSPECT').rightsTeamId),f.to);
 assert.deepEqual(after.state.history.seasons,before.state.history.seasons);
 assert.equal(after.state.activity.transactions.length,before.state.activity.transactions.length+1);
 assert.equal(after.consumedDecisionIds.length,1);
 assert.equal(lab.simulate({...request,expectedRevision:after.revision}).committed,false);
 assert.equal(lab.simulate({...request,decisionId:'different-decision'}).committed,false);
});
test('synthetic missing prospect rights rejects entire linked transaction and preserves replay ledger',()=>{
 const f=fixture(),lab=createIsolatedTransactionLab(f.state),before=lab.snapshot();
 const changes=JSON.parse(JSON.stringify(f.changes));
 changes.prospects[0].from='unverified-team';
 const result=lab.simulate({experimentalEnabled:true,gmApproved:true,expectedRevision:'revision-1',decisionId:'synthetic-invalid-rights',changes});
 assert.equal(result.committed,false);
 assert.deepEqual(lab.snapshot(),before);
});
test('synthetic multiasset cancellation and default-off leave all state unchanged',()=>{
 const f=fixture(),lab=createIsolatedTransactionLab(f.state),before=lab.snapshot();
 const request={experimentalEnabled:true,gmApproved:true,expectedRevision:'revision-1',decisionId:'synthetic-cancelled',changes:f.changes};
 assert.equal(lab.simulate({...request,cancelled:true}).committed,false);
 assert.equal(lab.simulate({...request,declined:true}).committed,false);
 assert.equal(lab.simulate({...request,experimentalEnabled:false}).committed,false);
 assert.deepEqual(lab.snapshot(),before);
});
