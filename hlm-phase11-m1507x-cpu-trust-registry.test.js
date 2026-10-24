'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {evaluate}=require('./hlm-phase11-m1507x-cpu-trust-registry');
const {canonical}=require('./hlm-phase11-m1507w-cpu-receipt-crypto');
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const state={meta:{controlledTeamId:'gm'},universe:{players:[]},assets:{contracts:[]},finances:{}};
const input={outgoingPlayerId:'out',incomingPlayerId:'in'},revision='source-rev';
const kp=crypto.generateKeyPairSync('ed25519');
function registry(verifier=()=>true){
 return {schema:'hlm-cpu-authority-registry-v1',provenance:'independently-provisioned',
 trustEstablished:true,revision:'registry-1',provenanceVerifier:verifier,
 teams:{cpu:{active:true,keys:{primary:{active:true,publicKeyPem:kp.publicKey.export({type:'spki',format:'pem'})}}}}};
}
function receipt(overrides={}){
 const id=identity(state,input,revision);
 const fields={proposalDigest:id.digest,stateRevision:id.revision,receivingTeamId:'cpu',
 decision:'accept',nonce:'nonce-1234567890123456',...overrides};
 return {...fields,signature:crypto.sign(null,Buffer.from(canonical(fields)),kp.privateKey).toString('base64url')};
}
test('independently verified registry binds key to team but never settles',()=>{
 const r=evaluate(state,input,revision,receipt(),registry(),'primary');
 assert.equal(r.signatureValid,true);assert.equal(r.receivingTeamVerified,true);
 assert.equal(r.authenticatedCpuConsent,false);assert.equal(r.replayProtected,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
});
test('caller-provided trust flags alone cannot establish provenance',()=>{
 const r=registry();delete r.provenanceVerifier;
 assert.equal(evaluate(state,input,revision,receipt(),r,'primary').receivingTeamVerified,false);
 assert.equal(evaluate(state,input,revision,receipt(),registry(()=>false),'primary').receivingTeamVerified,false);
});
test('unknown, revoked and mismatched receiving-team key fail closed',()=>{
 for(const [r,key] of [[registry(),'missing'],[registry(),'primary']]){
  if(key==='primary')r.teams.cpu.keys.primary.active=false;
  assert.equal(evaluate(state,input,revision,receipt(),r,key).settlementAuthorized,false);
  assert.equal(evaluate(state,input,revision,receipt(),r,key).receivingTeamVerified,false);
 }
 assert.equal(evaluate(state,input,revision,receipt({receivingTeamId:'other'}),registry(),'primary').receivingTeamVerified,false);
});
test('tampering, stale revisions and cancellation are blocked',()=>{
 const r=registry(),signed=receipt();
 assert.equal(evaluate(state,input,revision,{...signed,decision:'decline'},r,'primary').signatureValid,false);
 assert.equal(evaluate(state,input,'stale',signed,r,'primary').signatureValid,false);
 assert.equal(evaluate(state,input,revision,signed,r,'primary',{cancelled:true}).saved,false);
 assert.equal(evaluate(state,input,revision,signed,r,'primary',{declined:true}).saved,false);
});
test('repeat verification is not replay protection and does not mutate game state',()=>{
 const before=JSON.stringify(state),signed=receipt(),r=registry();
 for(let i=0;i<2;i++){
  const result=evaluate(state,input,revision,signed,r,'primary');
  assert.equal(result.replayProtected,false);assert.equal(result.saved,false);
 }
 assert.equal(JSON.stringify(state),before);
});
