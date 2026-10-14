(function(global){'use strict';
/* Standalone, read-only mobile opt-in preview. Deliberately NOT imported by app.html. */
const READINESS='HLMPhase11MobileReadiness';
async function preview({indexedDB:idb,backupFile,confirmation}={}){
 if(!idb||!backupFile||typeof backupFile.text!=='function')throw Error('Reopened backup File required');
 if(backupFile.size>6000000)throw Error('Backup too large');
 if(confirmation!=='I UNDERSTAND THIS IS A READ-ONLY PREVIEW')throw Error('Explicit GM preview confirmation required');
 const readiness=global[READINESS];
 if(!readiness||readiness.activationEnabled!==false||typeof readiness.inspect!=='function')throw Error('Readiness inspector unavailable or activated');
 const reopenedText=await backupFile.text();
 const result=await readiness.inspect(idb,reopenedText);
 return Object.freeze({ready:result.ready,reason:result.reason,backupSha256:result.backupSha256,controlledTeamId:result.controlledTeamId,customPlayers:result.customPlayers,unresolvedJournal:result.unresolvedJournal,activationEnabled:false,productionWrites:0,requiresSeparateImportAuthorization:true});
}
global.HLMPhase11MobileOptInPreview=Object.freeze({preview,productionActivationEnabled:false});
})(window);
