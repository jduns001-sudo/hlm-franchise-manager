(function(global){'use strict';
/* Advisory-only journal watcher: detection is sticky, no recovery or production writes. */
function create(idb){
 const api=global.HLMPhase11RecoveryStatus;
 if(!api||api.productionActivationEnabled!==false)throw Error('Read-only recovery status required');
 let invalidated=false,busy=false;
 const deny=reason=>Object.freeze({ready:false,blocked:true,reason,productionWrites:0,activationEnabled:false,requiresExplicitGMApproval:true});
 return Object.freeze({
  async inspect(){
   if(invalidated)return deny('Recovery watcher invalidated; create a new watcher');
   if(busy){invalidated=true;return deny('Overlapping recovery inspections invalidated watcher')}
   busy=true;
   try{
    const result=await api.inspect(idb);
    if(invalidated)return deny('Recovery watcher invalidated during inspection');
    if(result.blocked){invalidated=true;return deny(result.reason)}
    return Object.freeze({ready:true,blocked:false,reason:'Read-only recovery journal absent',productionWrites:0,activationEnabled:false,requiresExplicitGMApproval:true});
   }catch(e){invalidated=true;return deny('Recovery inspection failed: '+String(e.message||e))}
   finally{busy=false}
  },
  get invalidated(){return invalidated},
  productionActivationEnabled:false
 });
}
global.HLMPhase11StickyRecoveryWatcher=Object.freeze({create,productionActivationEnabled:false});
})(window);
