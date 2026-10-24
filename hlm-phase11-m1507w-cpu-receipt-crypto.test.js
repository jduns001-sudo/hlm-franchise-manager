'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {verify,canonical}=require('./hlm-phase11-m1507w-cpu-receipt-crypto');
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const state={meta:{controlledTeamId:'gm'},universe:{players:[]},assets:{contracts:[]},finances:{}};
const input={outgoingPlayerId:'out',incomingPlayerId:'in'},revision='source-rev';
const keys=crypto.generateKeyPairSync('ed25519'),other=crypto.generateKeyPairSync('ed25519');
function receipt(overrides={}){
 const id=identity(state,input,revision);
 const fields={proposalDigest:id.digest,stateRevision:id.revision,receivingTeamId:'cpu-team',
  decision:'accept',nonce:'nonce-1234567890123456',...overrides};
 const signature=crypto.sign(null,Buffer.from(canonical(fields)),keys.privateKey).toString('base64url');
 return {...fields,signature};
}
test('valid Ed25519 signature is recognized but never trusted or settled',()=>{
 const r=verify(state,input,revision,receipt(),keys.publicKey);
 assert.equal(r.signatureValid,true);assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.replayProtected,false);assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
});
test('wrong key, altered receipt, and fake signature fail verification',()=>{
 const r=receipt();
 for(const [p,key] of [[r,other.publicKey],[{...r,decision:'decline'},keys.publicKey],
  [{...r,signature:'A'.repeat(86)},keys.publicKey]]){
  const out=verify(state,input,revision,p,key);
  assert.equal(out.signatureValid,false);assert.equal(out.settlementAuthorized,false);
 }
});
test('stale revision, cancellation, decline, and malformed receipt fail closed',()=>{
 const r=receipt();
 assert.equal(verify(state,input,'changed',r,keys.publicKey).code,'stale-or-mismatched-receipt');
 for(const options of [{cancelled:true},{declined:true}])
  assert.equal(verify(state,input,revision,r,keys.publicKey,options).code,'gm-declined-or-cancelled');
 assert.equal(verify(state,input,revision,{...r,trusted:true},keys.publicKey).code,'invalid-receipt-shape');
});
test('repeated signed receipts are never represented as replay protected',()=>{
 const r=receipt();
 for(let i=0;i<3;i++){
  const out=verify(state,input,revision,r,keys.publicKey);
  assert.equal(out.signatureValid,true);assert.equal(out.replayProtected,false);
  assert.equal(out.authenticatedCpuConsent,false);
 }
});
test('read-only, no state mutation or storage writes',()=>{
 const before=JSON.stringify(state);
 verify(state,input,revision,receipt(),keys.publicKey);
 assert.equal(JSON.stringify(state),before);
});
