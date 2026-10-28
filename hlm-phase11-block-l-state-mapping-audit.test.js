"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {auditIsolatedStateMapping:audit}=require("./hlm-phase11-block-l-state-mapping-audit.js");
const state={meta:{saveId:"ISOLATED-1",controlledTeamId:"T1"}};
const reviewed={baseline:"opaque-browser-save",gameId:"G1",playerIds:["P1","P2"]};
const trusted={authoritative:true,source:"trusted-server",gm:"GM1",franchise:"SQLITE-F",
 revision:1,plan_id:"PLAN-1",decision_id:"D1",seed:17,
 browserSaveId:"ISOLATED-1",controlledTeamId:"T1",gameId:"G1",
 browserBaseline:"opaque-browser-save",playerIds:["P1","P2"]};
test("unmapped browser franchise never becomes a service identity",()=>{
 assert.equal(audit(state,reviewed,null).ready,false);
 assert.equal(audit(state,reviewed,{...trusted,authoritative:false}).ready,false);
 assert.equal(audit(state,reviewed,{...trusted,source:"browser"}).ready,false);
});
test("mismatched browser save, game, players or baseline cannot route",()=>{
 for(const patch of [{browserSaveId:"OTHER"},{controlledTeamId:"T2"},{gameId:"G2"},
 {browserBaseline:"stale"},{playerIds:["P2","P1"]},{revision:-1},{seed:null}]){
  assert.equal(audit(state,reviewed,{...trusted,...patch}).ready,false);
 }
});
test("complete trusted binding returns only validated service identifiers",()=>{
 assert.deepEqual(audit(state,reviewed,trusted),{
  ready:true,gm:"GM1",franchise:"SQLITE-F",revision:1,
  plan_id:"PLAN-1",decision_id:"D1",seed:17
 });
});
