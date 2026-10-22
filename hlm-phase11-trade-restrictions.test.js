'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateTradeRestrictions:check}=require('./hlm-phase11-trade-restrictions');
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{id:'c1',playerId:'a',teamId:1,status:'active',tradePermission:'allowed'},{id:'c2',playerId:'b',teamId:2,status:'active',tradePermission:'allowed'}]});
 s.extensions.tradeRosterLimits={1:23,2:23};return s;
}
const proposal={outgoingPlayerId:'a',incomingPlayerId:'b',controlledTeamId:1};
test('explicit source permissions and roster limits permit only further review, never settlement',()=>{
 const s=fixture(),before=JSON.stringify(s),r=check(s,proposal);
 assert.equal(r.eligibleForFurtherReview,true);assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);
});
test('missing, denied, or ambiguous trade permission fails closed',()=>{
 for(const value of [undefined,'denied','unknown',true]){
  const s=fixture();s.assets.contracts[0].tradePermission=value;assert.throws(()=>check(s,proposal),/permission/);
 }
});
test('missing or invalid roster limits fail closed',()=>{
 const s=fixture();delete s.extensions.tradeRosterLimits;assert.throws(()=>check(s,proposal),/roster limits/);
 const t=fixture();t.extensions.tradeRosterLimits[1]=0;assert.throws(()=>check(t,proposal),/Roster/);
});
test('wrong owner, duplicate contract, and suspended player fail closed',()=>{
 const a=fixture();a.universe.players[0].teamId=2;assert.throws(()=>check(a,proposal));
 const b=fixture();b.assets.contracts.push({...b.assets.contracts[0]});assert.throws(()=>check(b,proposal));
 const c=fixture();c.universe.players[0].status='suspended';assert.throws(()=>check(c,proposal));
});
