'use strict';
// Local test harness only. Never deploy this HTTP handler or treat fixture consent as authenticated.
const evidence=require('./hlm-phase11-m1638-local-trade-evidence');
const local=require('./hlm-phase11-m1637-local-atomic-trade');
const deny=(code)=>({ok:false,code,saved:false,settlementAuthorized:false,productionTouched:false,experimental:true});
function createHandler({db,fixture,enabled=false}){
 if(!db||!fixture)throw Error('Local fixture required');
 return async function handle(request){
  if(!enabled)return {status:403,body:deny('disabled-by-default')};
  if(request.method==='GET'&&request.path==='/state'){
   const saved=await local.read(db,fixture.slot);
   return {status:200,body:{ok:!!saved,revision:saved?.revision,players:saved?.state?.universe?.players?.map(p=>({id:p.id,teamId:p.teamId}))||[],experimental:true}};
  }
  if(request.method==='GET'&&request.path==='/review'){
   const result=await evidence.review(db,{slot:fixture.slot,expectedRevision:fixture.expectedRevision,teamId:fixture.teamId,input:fixture.input});
   return {status:result.ok?200:409,body:result};
  }
  if(request.method==='POST'&&request.path==='/decision'){
   if(!request.body||request.body.action!=='approve')return {status:200,body:deny('gm-cancelled-or-declined')};
   const review=await evidence.review(db,{slot:fixture.slot,expectedRevision:fixture.expectedRevision,teamId:fixture.teamId,input:fixture.input});
   if(!review.ok)return {status:409,body:review};
   if(request.body.proposalDigest!==review.proposalDigest||request.body.revision!==review.revision)return {status:409,body:deny('stale-or-changed-browser-review')};
   // Fixture evidence is injected by the local server, never accepted from browser JSON.
   const binding={proposalDigest:review.proposalDigest,slot:fixture.slot,revision:fixture.expectedRevision,teamId:fixture.teamId};
   const result=await evidence.settle(db,{localTestFixture:true,gmAction:'approve',cpuFixtureDecision:fixture.cpuFixtureDecision,slot:fixture.slot,expectedRevision:fixture.expectedRevision,nextRevision:fixture.nextRevision,decisionId:fixture.decisionId,proposalDigest:review.proposalDigest,teamId:fixture.teamId,input:fixture.input,gmReview:{...binding,approved:true},cpuFixtureEvidence:{...binding,decisionId:fixture.decisionId,decision:fixture.cpuFixtureDecision}});
   return {status:result.saved?200:409,body:result};
  }
  return {status:404,body:deny('not-found')};
 }
}
module.exports={createHandler};
