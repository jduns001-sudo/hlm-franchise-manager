'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateTradeEligibility:check}=require('./hlm-phase11-trade-financial-eligibility');
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{id:'c1',playerId:'a',teamId:1,status:'active',aav:4},{id:'c2',playerId:'b',teamId:2,status:'active',aav:5}],finances:{teamCapLimits:{1:10,2:10}}});
 s.finances.teamCapLimits={1:10,2:10};return s;
}
const proposal={outgoingPlayerId:'a',incomingPlayerId:'b',controlledTeamId:1};
test('source-backed contract and payroll review is pure, not settlement authorization',()=>{
 const s=fixture(),before=JSON.stringify(s),result=check(s,proposal);
 assert.equal(result.eligibleForFurtherReview,true);assert.equal(result.settlementAuthorized,false);
 assert.equal(result.projectedPayroll[1],5);assert.equal(result.projectedPayroll[2],4);
 assert.equal(JSON.stringify(s),before);
});
test('missing, duplicated or mismatched contract records fail closed',()=>{
 for(const mutate of [s=>s.assets.contracts=[],s=>s.assets.contracts.push({...s.assets.contracts[0]}),s=>s.assets.contracts[0].teamId=2,s=>s.assets.contracts[0].aav='4']){
  const s=fixture();mutate(s);assert.throws(()=>check(s,proposal));
 }
});
test('missing source cap limits and over-cap trades fail closed',()=>{
 const s=fixture();delete s.finances.teamCapLimits;assert.throws(()=>check(s,proposal));
 const t=fixture();t.finances.teamCapLimits[1]=4;assert.throws(()=>check(t,proposal),/salary cap/);
});
test('uncontrolled or invented players never qualify',()=>{
 assert.throws(()=>check(fixture(),{...proposal,controlledTeamId:2}));
 assert.throws(()=>check(fixture(),{...proposal,incomingPlayerId:'invented'}));
});
