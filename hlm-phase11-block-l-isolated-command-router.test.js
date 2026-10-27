"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {createIsolatedCommandRouter}=require("./hlm-phase11-block-l-isolated-command-router.js");
const initial={gm:"GM1",franchise:"SYNTHETIC-F",revision:1,plan_id:"P1",decision_id:"D1",seed:17};
function fixture(){
 let state={...initial},calls=[],settled=false;
 const adapter=Object.fromEntries(["review","recover","decline","approve"].map(action=>[action,async request=>{
   calls.push({action,...request});
   return action==="review"?{review_id:"R1",committed:false}:
     action==="approve"?{committed:!settled&&(settled=true)}:{committed:false,status:action==="decline"?"declined":"pending"};
 }]));
 const router=createIsolatedCommandRouter({enabled:true,adapter,snapshot:async()=>({...state}),
   identity:async()=>({authenticated:true,gm:"GM1",franchise:"SYNTHETIC-F"})});
 return {router,calls,change:patch=>{state={...state,...patch}}};
}
test("default off never reads or calls service",async()=>{
 let calls=0;
 const router=createIsolatedCommandRouter({snapshot:()=>{calls++},adapter:{review:()=>{calls++}}});
 await assert.rejects(router.review(),/disabled/);assert.equal(calls,0);
});
test("review, no-save decline, recovery, approval, and no implicit replay",async()=>{
 const f=fixture();await f.router.review();await f.router.decline();await f.router.recover();
 assert.equal((await f.router.approve()).committed,true);
 await assert.rejects(f.router.approve(),/No reviewed command/);
 assert.deepEqual(f.calls.map(c=>c.action),["review","decline","recover","approve"]);
 assert.ok(f.calls.every(c=>c.gm==="GM1"&&c.plan_id==="P1"&&c.franchise==="SYNTHETIC-F"));
});
test("stale revision, plan, identity and decision never send settlement",async()=>{
 for(const patch of [{revision:2},{plan_id:"P2"},{decision_id:"D2"},{gm:"ATTACKER"},{franchise:"OTHER"}]){
  const f=fixture();await f.router.review();f.change(patch);
  await assert.rejects(f.router.approve(),/Stale|mismatch/);
  assert.equal(f.calls.length,1);
 }
});
test("reload has no implicit review token or service action",async()=>{
 const f=fixture();await f.router.review();
 const replacement=createIsolatedCommandRouter({enabled:true,adapter:{approve:async()=>{throw Error("should not send")}},
  snapshot:async()=>({...initial}),identity:async()=>({authenticated:true,gm:"GM1",franchise:"SYNTHETIC-F"})});
 await assert.rejects(replacement.approve(),/No reviewed command/);
});
test("cancelled action cannot create settlement",async()=>{
 const f=fixture();await f.router.review();f.router.clear();
 await assert.rejects(f.router.approve(),/No reviewed command/);
 assert.equal(f.calls.length,1);
});

test("missing or invalid deterministic seed never sends service command",async()=>{
 for(const seed of [undefined,-1,1.5,"17",null]){
  const f=fixture();f.change({seed});
  await assert.rejects(f.router.review(),/Reviewed plan/);
  assert.equal(f.calls.length,0);
 }
});
