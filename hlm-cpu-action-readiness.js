'use strict';
const {createCPUActionAuthorizationVerification}=require('./hlm-cpu-action-authorization-verification');

function assessCPUActionReadiness(verificationPackage){
 const reasons=[];
 const verification=verificationPackage?.verification;
 const authorization=verificationPackage?.authorizationPackage;
 if(verificationPackage?.kind!=='cpu-action-authorization-verification-package') reasons.push('invalid-verification-package');
 if(verification?.verified!==true||verificationPackage?.validation?.valid!==true) reasons.push('authorization-not-verified');
 if(verificationPackage?.teamId!==authorization?.teamId||verification?.teamId!==authorization?.teamId) reasons.push('team-mismatch');
 if(authorization?.authorization?.authorized!==true) reasons.push('human-authorization-required');
 if(authorization?.candidate?.verification?.verified!==true) reasons.push('transaction-not-verified');
 if(authorization?.decisionStage?.actPerformed!==false||authorization?.authority?.cpuDecisionExecutionEnabled!==false) reasons.push('execution-boundary-violated');
 if(verificationPackage?.sourceStateMutated!==false||verificationPackage?.persistencePerformed!==false) reasons.push('mutation-boundary-violated');
 return Object.freeze({kind:'cpu-action-readiness-assessment',version:1,teamId:verificationPackage?.teamId??null,ready:reasons.length===0,reasons:Object.freeze(reasons),executionEnabled:false,executionPerformed:false,persistencePerformed:false,sourceStateMutated:false});
}
function createCPUActionReadiness(state,teamId,options={}){
 const before=JSON.stringify(state);
 const verificationPackage=createCPUActionAuthorizationVerification(state,teamId,options);
 const readiness=assessCPUActionReadiness(verificationPackage);
 if(JSON.stringify(state)!==before) throw new Error('CPU readiness unexpectedly mutated source state');
 return Object.freeze({kind:'cpu-action-readiness-package',version:1,teamId:verificationPackage.teamId,verificationPackage,readiness,validation:Object.freeze({valid:readiness.ready}),decisionStage:Object.freeze({...verificationPackage.decisionStage,stage:'act-readiness',actReady:readiness.ready,actPerformed:false}),executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={assessCPUActionReadiness,createCPUActionReadiness};
