(function(global){'use strict';
/* Isolated read-only session: a stale save or unresolved journal permanently invalidates this session. */
function create(idb){
 const fingerprints=global.HLMPhase11SaveFingerprint;
 if(!fingerprints||fingerprints.productionActivationEnabled!==false)throw Error('Read-only fingerprint dependency required');
 let baseline=null,invalidated=false;
 const deny=reason=>Object.freeze({ready:false,blocked:true,reason,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 return Object.freeze({
  async begin(){
   if(invalidated)return deny('Session invalidated; create a new session');
   if(baseline)return deny('Session already started');
   const snap=await fingerprints.capture(idb);
   if(!snap.savePresent||snap.unresolvedJournal){invalidated=true;return deny(snap.unresolvedJournal?'Unresolved recovery journal':'Franchise save missing')}
   baseline=snap;
   return Object.freeze({ready:true,blocked:false,reason:'Read-only session started',productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
  },
  async recheck(){
   if(invalidated)return deny('Session invalidated; create a new session');
   if(!baseline)return deny('Session not started');
   let result;
   try{result=await fingerprints.compare(idb,baseline)}catch(e){invalidated=true;return deny('Unable to verify save: '+String(e.message||e))}
   if(result.blocked){invalidated=true;return deny(result.reason)}
   return Object.freeze({ready:true,blocked:false,reason:'Advisory save unchanged',productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
  },
  get invalidated(){return invalidated},
  get productionActivationEnabled(){return false}
 });
}
global.HLMPhase11AdvisorySaveSession=Object.freeze({create,productionActivationEnabled:false});
})(window);
