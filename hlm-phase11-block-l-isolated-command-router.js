/* Block L isolated command router. Deliberately unmounted, default off, never writes browser saves. */
(function(root){"use strict";
function createIsolatedCommandRouter(config){
  config=config||{};
  const enabled=config.enabled===true;
  if(enabled&&(!config.adapter||typeof config.snapshot!=="function"||typeof config.identity!=="function"))
    throw Error("Explicit adapter, trusted identity and isolated snapshot required");
  let pending=false,active=null;
  function validate(snapshot,session){
    if(!snapshot||!session||session.authenticated!==true||typeof session.gm!=="string"||!session.gm)
      throw Error("Trusted GM session required");
    if(typeof snapshot.franchise!=="string"||!snapshot.franchise||
       !Number.isSafeInteger(snapshot.revision)||snapshot.revision<0||
       typeof snapshot.plan_id!=="string"||!snapshot.plan_id||
       typeof snapshot.decision_id!=="string"||!snapshot.decision_id||
       !Number.isSafeInteger(snapshot.seed)||snapshot.seed<0)
      throw Error("Reviewed plan, franchise, revision and decision required");
    if(snapshot.gm!==session.gm||snapshot.franchise!==session.franchise)
      throw Error("Isolated GM franchise mismatch");
    return {gm:session.gm,franchise:snapshot.franchise,revision:snapshot.revision,
      plan_id:snapshot.plan_id,decision_id:snapshot.decision_id,seed:snapshot.seed};
  }
  function equal(a,b){return a&&b&&["gm","franchise","revision","plan_id","decision_id","seed"].every(k=>a[k]===b[k]);}
  async function invoke(action){
    if(!enabled)throw Error("Block L router disabled");
    if(pending)throw Error("Block L request pending");
    pending=true;
    try{
      const session=await config.identity();
      const expected=validate(await config.snapshot(),session);
      if(action!=="review"&&!active)throw Error("No reviewed command");
      if(active&&!equal(expected,active))throw Error("Stale reviewed command");
      const method=config.adapter[action];
      if(typeof method!=="function")throw Error("Unsupported GM command");
      const request={...expected};
      if(active)request.review_id=active.review_id;
      const result=await method(request);
      if(!equal(validate(await config.snapshot(),await config.identity()),expected))
        throw Error("Stale isolated state after service request; recovery required");
      if(action==="review"){
        if(!result||typeof result.review_id!=="string"||!result.review_id)throw Error("Missing review token");
        active={...expected,review_id:result.review_id};
      }
      if(action==="approve"&&result&&result.committed===true)active=null;
      return result;
    }finally{pending=false;}
  }
  return Object.freeze({enabled,review:()=>invoke("review"),recover:()=>invoke("recover"),
    approve:()=>invoke("approve"),decline:()=>invoke("decline"),
    clear:()=>{if(pending)throw Error("Block L request pending");active=null;}});
}
if(typeof module!=="undefined"&&module.exports)module.exports={createIsolatedCommandRouter};
else root.HLMBlockLIsolatedCommandRouter=Object.freeze({createIsolatedCommandRouter});
})(typeof globalThis!=="undefined"?globalThis:this);
