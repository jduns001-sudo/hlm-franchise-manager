'use strict';
/* Mission 1517: source-backed review integration only; never a real settlement. */
const {stage}=require('./hlm-phase11-m1515-isolated-trade-state-transition');
function review(state,input,options={}){
 const deny=code=>({ok:false,code,saved:false,settlementAuthorized:false});
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true)return deny('gm-approval-required');
 const staged=stage(state,input,options);
 if(!staged.ok)return deny(staged.code);
 const revision=staged.gameRevision;
 if(!Number.isSafeInteger(revision)||revision<0||revision===Number.MAX_SAFE_INTEGER)return deny('invalid-revision');
 const candidate=JSON.parse(JSON.stringify(staged.nextState));
 if(candidate.meta?.revision!==revision)return deny('source-revision-mismatch');
 candidate.meta.revision=revision+1;
 return {ok:true,code:'review-only',candidateState:candidate,expectedRevision:revision,
  receivingTeamConsentAuthenticated:false,saved:false,settlementAuthorized:false,experimental:true};
}
async function requestSettlement(state,input,options={}){
 const result=review(state,input,options);
 if(!result.ok)return result;
 return {ok:false,code:'cpu-consent-not-authenticated',reviewAvailable:true,saved:false,settlementAuthorized:false};
}
module.exports={review,requestSettlement};
