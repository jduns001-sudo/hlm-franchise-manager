'use strict';
const {authorizeCPUActionCandidate}=require('./hlm-cpu-action-authorization');

function verifyCPUActionAuthorization(pkg){
 const authorization=pkg?.authorization;
 const candidate=pkg?.candidate;
 const reasons=[];
 if(pkg?.kind!=='cpu-action-authorization-package'||authorization?.kind!=='cpu-action-authorization') reasons.push('invalid-authorization-package');
 if(candidate?.kind!=='cpu-action-candidate-package') reasons.push('invalid-candidate-package');
 if(authorization?.teamId!==pkg?.teamId||candidate?.teamId!==pkg?.teamId) reasons.push('team-mismatch');
 if(authorization?.priorityId!==candidate?.action?.priorityId||authorization?.optionId!==candidate?.action?.optionId) reasons.push('action-mismatch');
 if(candidate?.validation?.valid!==true||candidate?.verification?.verified!==true||authorization?.candidateValid!==true) reasons.push('candidate-not-verified');
 if(authorization?.requested!==true||authorization?.authorized!==true||authorization?.humanAuthorizationProvided!==true) reasons.push('human-authorization-missing');
 if(pkg?.validation?.valid!==true||pkg?.decisionStage?.actAuthorized!==true) reasons.push('authorization-invalid');
 if(authorization?.executionEnabled!==false||pkg?.authority?.cpuDecisionExecutionEnabled!==false||pkg?.decisionStage?.actPerformed!==false) reasons.push('execution-boundary-violated');
 if(pkg?.sourceStateMutated!==false||pkg?.persistencePerformed!==false||authorization?.sourceStateMutated!==false||authorization?.persistencePerformed!==false) reasons.push('mutation-boundary-violated');
 const verified=reasons.length===0;
 return Object.freeze({kind:'cpu-action-authorization-verification',version:1,teamId:pkg?.teamId??null,verified,reasons:Object.freeze(reasons),executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
}
function createCPUActionAuthorizationVerification(state,teamId,options={}){
 const before=JSON.stringify(state);
 const authorizationPackage=authorizeCPUActionCandidate(state,teamId,options);
 const verification=verifyCPUActionAuthorization(authorizationPackage);
 if(JSON.stringify(state)!==before) throw new Error('CPU authorization unexpectedly mutated source state');
 return Object.freeze({kind:'cpu-action-authorization-verification-package',version:1,teamId:authorizationPackage.teamId,authorizationPackage,verification,validation:Object.freeze({valid:verification.verified}),decisionStage:Object.freeze({...authorizationPackage.decisionStage,stage:'act-authorization-verification',actPerformed:false}),sourceStateMutated:false,persistencePerformed:false});
}
module.exports={verifyCPUActionAuthorization,createCPUActionAuthorizationVerification};
