(function(global){'use strict';
/* Isolated advisory mobile lifecycle guard. Never auto-resumes an inspection or writes saves. */
function create(idb,doc){
 const api=global.HLMPhase11RecoveryCoordinator;
 if(!api||api.productionActivationEnabled!==false||!doc||typeof doc.addEventListener!=='function')throw Error('Read-only coordinator and document required');
 const coordinator=api.create(idb);
 let invalidated=false,disposed=false,busy=false,reason='Mobile session invalidated';
 const deny=why=>Object.freeze({ready:false,blocked:true,reason:why,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 function invalidate(why){invalidated=true;reason=why||reason}
 const visibility=()=>{if(doc.visibilityState==='hidden')invalidate('Mobile tab hidden; fresh inspection required')};
 const pagehide=()=>invalidate('Mobile page suspended; fresh inspection required');
 doc.addEventListener('visibilitychange',visibility);
 global.addEventListener('pagehide',pagehide);
 async function run(method){
  if(disposed||invalidated)return deny(reason);
  if(busy){invalidate('Overlapping mobile inspection');return deny(reason)}
  busy=true;
  try{
   const result=await coordinator[method]();
   if(disposed||invalidated)return deny(reason);
   if(!result.ready){invalidate(result.reason);return deny(reason)}
   return result;
  }catch(e){invalidate('Mobile inspection failed: '+String(e.message||e));return deny(reason)}
  finally{busy=false}
 }
 return Object.freeze({
  begin:()=>run('begin'),recheck:()=>run('recheck'),
  dispose(){disposed=true;invalidate('Mobile session disposed');doc.removeEventListener('visibilitychange',visibility);global.removeEventListener('pagehide',pagehide)},
  get invalidated(){return invalidated||coordinator.invalidated},productionActivationEnabled:false
 });
}
global.HLMPhase11MobileLifecycleGuard=Object.freeze({create,productionActivationEnabled:false});
})(window);
