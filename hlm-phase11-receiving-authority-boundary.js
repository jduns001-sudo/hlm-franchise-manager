'use strict';
/* Mission 1449: fail-closed receiving-team authority boundary. Preview only.
 * No verifier is wired to production. Saved consent claims are NEVER authentication. */
const {inspect}=require('./hlm-phase11-trade-settlement-readiness');
function canonicalRequest(state,input){
 if(!state||!input)throw Error('Trade state and input required');
 const readiness=inspect(state,input); // reuse all financial, roster and contract checks
 const teamId=readiness.receivingTeam.receivingTeamId;
 return Object.freeze({receivingTeamId:String(teamId),controlledTeamId:String(state.meta.controlledTeamId),
  outgoingPlayerId:String(input.outgoingPlayerId),incomingPlayerId:String(input.incomingPlayerId)});
}
function verifyReceivingAuthority(state,input,proof,verifier){
 const request=canonicalRequest(state,input);
 const blocked={status:'receiving-authority-unverified',independentlyAuthenticated:false,
  settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true};
 if(!proof||typeof proof!=='object'||Array.isArray(proof))
  return Object.freeze({...blocked,reason:'Independent receiving-team proof missing'});
 if(!verifier||typeof verifier.verify!=='function')
  return Object.freeze({...blocked,reason:'No independent authority verifier installed'});
 // Verifier must be supplied by a separately audited trusted integration, never by
 // state.extensions or caller-provided flags. Fail closed on all errors.
 let verified=false;
 try{verified=verifier.verify(Object.freeze({...request}),proof)===true}
 catch{return Object.freeze({...blocked,reason:'Independent verification failed closed'})}
 if(!verified)return Object.freeze({...blocked,reason:'Independent verification rejected proof'});
 // Even authenticated consent cannot authorize atomic settlement or save writes.
 return Object.freeze({status:'receiving-authority-verified-settlement-blocked',
  independentlyAuthenticated:true,settlementAuthorized:false,
  atomicSettlementVerified:false,saved:false,experimental:true,
  reason:'Independent proof accepted by injected verifier; atomic settlement not implemented'});
}
module.exports={canonicalRequest,verifyReceivingAuthority};
