'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {verifyReceivingAuthority,canonicalRequest}=require('./hlm-phase11-receiving-authority-boundary');
const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
function fixture(){const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],
 players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[
 {playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 s.history.seasons=[{year:2034,champion:1}];return s;}
test('saved consent and caller flags cannot independently authenticate',()=>{
 const s=fixture(),before=JSON.stringify(s);
 for(const [proof,verifier] of [[null,null],[{accepted:true},null],[{accepted:true},{verify:()=>false}]]){
 const r=verifyReceivingAuthority(s,input,proof,verifier);
 assert.equal(r.independentlyAuthenticated,false);assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
 }
 assert.equal(JSON.stringify(s),before);
});
test('request binds both team identities and precise player exchange',()=>{
 const request=canonicalRequest(fixture(),input);
 assert.deepEqual(request,{receivingTeamId:'2',controlledTeamId:'1',outgoingPlayerId:'a',incomingPlayerId:'b'});
 assert.equal(Object.isFrozen(request),true);
});
test('independent verifier failure and exceptions fail closed',()=>{
 const s=fixture();
 assert.equal(verifyReceivingAuthority(s,input,{id:'x'},{verify:()=>{throw Error('bad proof')}}).independentlyAuthenticated,false);
 assert.equal(verifyReceivingAuthority(s,input,{id:'x'},{verify:()=>1}).independentlyAuthenticated,false);
});
test('trusted verifier integration contract still cannot settle, mutate or save',()=>{
 const s=fixture(),before=JSON.stringify(s);
 const proof=Object.freeze({signedBy:'test-fixture-only'});
 const result=verifyReceivingAuthority(s,input,proof,{verify:(request,p)=>request.receivingTeamId==='2'&&p===proof});
 assert.equal(result.independentlyAuthenticated,true);
 assert.equal(result.settlementAuthorized,false);assert.equal(result.atomicSettlementVerified,false);assert.equal(result.saved,false);
 assert.equal(JSON.stringify(s),before);assert.deepEqual(s.history.seasons,[{year:2034,champion:1}]);
});
test('missing or invalid source consent and financial uncertainty reject before verifier',()=>{
 for(const mutate of [s=>{s.extensions.tradeDecisionConsents=[]},
 s=>{s.finances.teamCapLimits[1]=4}]){
 const s=fixture();mutate(s);let called=false;
 assert.throws(()=>verifyReceivingAuthority(s,input,{}, {verify:()=>{called=true;return true}}));
 assert.equal(called,false);
 }
});
