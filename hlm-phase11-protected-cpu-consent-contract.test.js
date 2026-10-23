'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {evaluateCpuConsent}=require('./hlm-phase11-protected-cpu-consent-contract');
const base={version:1,decisionId:'unique-1',proposalDigest:'sha256:exact',teamId:'cpu-team',stateRevision:'revision-8',issuedAt:'2026-10-22T00:00:00Z',expiresAt:'2026-10-24T00:00:00Z',signature:'opaque',keyId:'protected-key',decision:'approve'};
const args=()=>({envelope:{...base},proposalDigest:base.proposalDigest,teamId:base.teamId,stateRevision:base.stateRevision,now:'2026-10-23T00:00:00Z',verifier:{verify:async()=>true},ledger:{consumeOnce:async()=>true}});
test('valid contract does not authorize settlement',async()=>{const r=await evaluateCpuConsent(args());assert.equal(r.accepted,true);assert.equal(r.settlementAuthorized,false)});
for(const [name,change] of Object.entries({
 forged:a=>{a.verifier.verify=async()=>false},
 expired:a=>{a.now='2026-10-25T00:00:00Z'},
 stale:a=>{a.stateRevision='revision-9'},
 wrongTeam:a=>{a.teamId='other'},
 wrongProposal:a=>{a.proposalDigest='sha256:other'},
 malformed:a=>{a.envelope.signature=''},
 noVerifier:a=>{a.verifier=null},
 noLedger:a=>{a.ledger=null},
 cancelled:a=>{a.signal={aborted:true}},
 storageFailure:a=>{a.ledger.consumeOnce=async()=>{throw Error('disk unavailable')}},
 verificationFailure:a=>{a.verifier.verify=async()=>{throw Error('trust root offline')}},
 duplicate:a=>{a.ledger.consumeOnce=async()=>false}
})) test('fail closed: '+name,async()=>{const a=args();change(a);assert.equal((await evaluateCpuConsent(a)).accepted,false)});
test('concurrent duplicate requests require atomic single winner from ledger',async()=>{
 const used=new Set();
 const ledger={consumeOnce:async id=>{if(used.has(id))return false;used.add(id);return true}};
 const results=await Promise.all(Array.from({length:12},()=>evaluateCpuConsent({...args(),ledger})));
 assert.equal(results.filter(r=>r.accepted).length,1);
});
test('cancellation after verification does not consume',async()=>{
 const a=args();let consumed=0;const signal={aborted:false};
 a.signal=signal;a.verifier.verify=async()=>{signal.aborted=true;return true};
 a.ledger.consumeOnce=async()=>{consumed++;return true};
 assert.equal((await evaluateCpuConsent(a)).accepted,false);assert.equal(consumed,0);
});
