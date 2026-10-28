/* Block L mapping audit. No browser save is ever promoted into an SQLite identity. */
(function(root){"use strict";
function auditIsolatedStateMapping(browserState,reviewed,serverBinding){
 if(!browserState||!browserState.meta||!reviewed||!serverBinding)
   return Object.freeze({ready:false,reason:"missing_authoritative_mapping"});
 const saveId=browserState.meta.saveId;
 const teamId=browserState.meta.controlledTeamId;
 if(saveId==null||teamId==null||!reviewed.baseline||!reviewed.gameId||
    !Array.isArray(reviewed.playerIds))
   return Object.freeze({ready:false,reason:"incomplete_browser_review"});
 if(serverBinding.authoritative!==true||serverBinding.source!=="trusted-server"||
    typeof serverBinding.gm!=="string"||!serverBinding.gm||
    typeof serverBinding.franchise!=="string"||!serverBinding.franchise||
    !Number.isSafeInteger(serverBinding.revision)||serverBinding.revision<0||
    typeof serverBinding.plan_id!=="string"||!serverBinding.plan_id||
    typeof serverBinding.decision_id!=="string"||!serverBinding.decision_id||
    !Number.isSafeInteger(serverBinding.seed)||serverBinding.seed<0)
   return Object.freeze({ready:false,reason:"missing_authoritative_mapping"});
 // Browser save IDs, team IDs and reviewed player lists are not trusted service identities.
 // A server-issued binding must explicitly attest to the exact source save and plan.
 if(serverBinding.browserSaveId!==String(saveId)||
    serverBinding.controlledTeamId!==String(teamId)||
    serverBinding.gameId!==String(reviewed.gameId)||
    serverBinding.browserBaseline!==reviewed.baseline||
    JSON.stringify(serverBinding.playerIds)!==JSON.stringify(reviewed.playerIds))
   return Object.freeze({ready:false,reason:"state_mapping_mismatch"});
 return Object.freeze({ready:true,gm:serverBinding.gm,franchise:serverBinding.franchise,
   revision:serverBinding.revision,plan_id:serverBinding.plan_id,
   decision_id:serverBinding.decision_id,seed:serverBinding.seed});
}
if(typeof module!=="undefined"&&module.exports)module.exports={auditIsolatedStateMapping};
else root.HLMBlockLMappingAudit=Object.freeze({auditIsolatedStateMapping});
})(typeof globalThis!=="undefined"?globalThis:this);
