(function(global){'use strict';
/* Isolated read-only session: stale saves, journals, failed reads and overlapping inspections fail closed. */
function create(idb){
 const fingerprints=global.HLMPhase11SaveFingerprint;
 if(!fingerprints||fingerprints.productionActivationEnabled!==false)throw Error('Read-only fingerprint dependency required');
 let baseline=null,invalidated=false,busy=false;
 const deny=reason=>Object.freeze({ready:false,blocked:true,reason,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 const allow=reason=>Object.freeze({ready:true,blocked:false,reason,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 function enter(){
  if(invalidated)return deny('Session invalidated; create a new session');
  if(busy){invalidated=true;return deny('Overlapping inspection invalidated session')}
  busy=true;
  return null;
 }
 return Object.freeze({
  async begin(){
   const blocked=enter();if(blocked)return blocked;
   try{
    if(baseline)return deny('Session already started');
    const snap=await fingerprints.capture(idb);
    if(invalidated)return deny('Session invalidated during inspection');
    if(!snap.savePresent||snap.unresolvedJournal){invalidated=true;return deny(snap.unresolvedJournal?'Unresolved recovery journal':'Franchise save missing')}
    baseline=snap;
    return allow('Read-only session started');
   }catch(e){invalidated=true;return deny('Unable to inspect save: '+String(e.message||e))}
   finally{busy=false}
  },
  async recheck(){
   const blocked=enter();if(blocked)return blocked;
   try{
    if(!baseline)return deny('Session not started');
    const result=await fingerprints.compare(idb,baseline);
    if(invalidated)return deny('Session invalidated during inspection');
    if(result.blocked){invalidated=true;return deny(result.reason)}
    return allow('Advisory save unchanged');
   }catch(e){invalidated=true;return deny('Unable to verify save: '+String(e.message||e))}
   finally{busy=false}
  },
  get invalidated(){return invalidated},
  get productionActivationEnabled(){return false}
 });
}
global.HLMPhase11AdvisorySaveSession=Object.freeze({create,productionActivationEnabled:false});
})(window);
