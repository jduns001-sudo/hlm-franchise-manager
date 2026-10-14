(function(global){'use strict';
/* Advisory-only coordinator: no writes, production integration or recovery authorization. */
function create(idb){
 const sessionApi=global.HLMPhase11AdvisorySaveSession,recovery=global.HLMPhase11RecoveryStatus;
 if(!sessionApi||sessionApi.productionActivationEnabled!==false||!recovery||recovery.productionActivationEnabled!==false)throw Error('Read-only dependencies required');
 const session=sessionApi.create(idb);let started=false,blocked=false,busy=false;
 const deny=reason=>Object.freeze({ready:false,blocked:true,reason,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 const allow=reason=>Object.freeze({ready:true,blocked:false,reason,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
 async function run(initial){
  if(blocked)return deny('Coordinator invalidated; create a new coordinator');
  if(busy){blocked=true;return deny('Overlapping inspection invalidated coordinator')}
  busy=true;
  try{
   if(initial&&started){blocked=true;return deny('Coordinator already started')}
   if(!initial&&!started)return deny('Coordinator not started');
   const first=await recovery.inspect(idb);
   if(blocked)return deny('Coordinator invalidated during inspection');
   if(first.blocked){blocked=true;return deny(first.reason)}
   const result=initial?await session.begin():await session.recheck();
   if(blocked)return deny('Coordinator invalidated during inspection');
   if(!result.ready){blocked=true;return deny(result.reason)}
   const last=await recovery.inspect(idb);
   if(blocked)return deny('Coordinator invalidated during inspection');
   if(last.blocked){blocked=true;return deny(last.reason)}
   const recheck=await session.recheck();
   if(blocked)return deny('Coordinator invalidated during inspection');
   if(!recheck.ready){blocked=true;return deny(recheck.reason)}
   started=true;
   return allow('Advisory save and recovery status unchanged');
  }catch(e){blocked=true;return deny('Unable to verify safe status: '+String(e.message||e))}
  finally{busy=false}
 }
 return Object.freeze({begin:()=>run(true),recheck:()=>run(false),get invalidated(){return blocked},productionActivationEnabled:false});
}
global.HLMPhase11RecoveryCoordinator=Object.freeze({create,productionActivationEnabled:false});
})(window);
