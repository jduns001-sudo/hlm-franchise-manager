'use strict';
// TEST-ONLY server-owned identity fixture. Not a production auth provider.
// The test server owns this secret; caller claims and callbacks are ignored.
const crypto=require('node:crypto');
const GM_SECRET=crypto.randomBytes(32);
const CPU_SECRET=crypto.randomBytes(32);
const mac=(secret,message)=>crypto.createHmac('sha256',secret).update(message).digest('hex');
const valid=(actual,expected)=>typeof actual==='string'&&/^[0-9a-f]{64}$/.test(actual)&&crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));
function createIsolatedServerIdentityLab(){
 const sessions=new Map(),decisions=new Map();
 function issueGmSession(franchiseId,gmId){
  if(typeof franchiseId!=='string'||!franchiseId||typeof gmId!=='string'||!gmId)throw Error('invalid-identity');
  const sessionId=crypto.randomUUID(),proof=mac(GM_SECRET,sessionId+'|'+franchiseId+'|'+gmId);
  sessions.set(sessionId,{franchiseId,gmId,proof});
  return Object.freeze({sessionId,proof,franchiseId,gmId});
 }
 function issueCpuDecision(franchiseId,revision,digest,decision='accepted'){
  if(![franchiseId,revision,digest].every(x=>typeof x==='string'&&x)||!['accepted','rejected'].includes(decision))throw Error('invalid-decision');
  const decisionId=crypto.randomUUID(),proof=mac(CPU_SECRET,[decisionId,franchiseId,revision,digest,decision].join('|'));
  decisions.set(decisionId,{franchiseId,revision,digest,decision,proof});
  return Object.freeze({decisionId,franchiseId,revision,digest,decision,proof});
 }
 function inspect({gm, cpu, franchiseId, revision, digest, gmApproved, cancelled, declined, experimentalEnabled}={}){
  const reasons=[];
  if(experimentalEnabled!==true)reasons.push('default-off');
  if(cancelled===true||declined===true)reasons.push('gm-cancelled-or-declined');
  if(gmApproved!==true)reasons.push('explicit-gm-approval-required');
  const s=sessions.get(gm?.sessionId),d=decisions.get(cpu?.decisionId);
  if(!s||s.franchiseId!==franchiseId||s.gmId!==gm?.gmId||!valid(gm?.proof,s.proof))reasons.push('gm-session-not-authenticated');
  if(!d||d.franchiseId!==franchiseId||d.revision!==revision||d.digest!==digest||d.decision!=='accepted'||!valid(cpu?.proof,d.proof))reasons.push('cpu-decision-not-authenticated');
  // Even valid lab identities cannot authorize a production settlement.
  return Object.freeze({status:reasons.length?'rejected':'lab-identity-verified-only',reasons:Object.freeze(reasons),labIdentityVerified:reasons.length===0,settlementAuthorized:false,saved:false,productionSaved:false});
 }
 return Object.freeze({issueGmSession,issueCpuDecision,inspect});
}
module.exports={createIsolatedServerIdentityLab};
