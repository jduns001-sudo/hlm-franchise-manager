'use strict';
const base=require('node:assert/strict'),api=require('./hlm-phase11-lineup-plan');let assertions=0;
const a=new Proxy(base,{get:(t,k)=>typeof t[k]==='function'?(...args)=>{assertions++;return t[k](...args)}:t[k]});
const clone=structuredClone;
function state(){return {meta:{saveId:'lineup-test',controlledTeamId:1},universe:{teams:[{id:1},{id:2}],players:['C','LW','RW','D','D','G','F','C'].map((position,i)=>({id:i+1,teamId:1,name:'Saved '+i,position,overall:75})).concat({id:20,teamId:2,position:'C',overall:80})},activity:{injuries:[],transactions:[],games:[]},assets:{contracts:[]},extensions:{sentinel:{keep:true},phase11GmApprovedSkaters:{teamId:1,playerIds:[1,2,3]}}};}
const s=state(),before=JSON.stringify(s),plan=api.empty(s);plan.slots={C:1,LW:2,RW:3,D1:4,D2:5,G:6};plan.depth={C:[1,8],LW:[2],RW:[3],D:[5,4],F:[7],G:[6]};
const payload=p=>({saveId:s.meta.saveId,teamId:1,plan:p});
a.deepEqual(api.validate(s,plan),plan);a.deepEqual(api.validate(s,api.empty(s)),api.empty(s));a.equal(JSON.stringify(s),before);
const next=api.replacement(s,payload(plan));a.deepEqual(next.extensions.phase11LineupPlan,plan);a.deepEqual(next.extensions.sentinel,s.extensions.sentinel);a.deepEqual(next.extensions.phase11GmApprovedSkaters,s.extensions.phase11GmApprovedSkaters);a.equal(JSON.stringify(s),before);a.notEqual(next.extensions.phase11LineupPlan,plan);
function reject(change,code,mutate=()=>{}){const st=state(),p=clone(plan);change(p);mutate(st);a.throws(()=>api.validate(st,p),e=>e.code===code);}
reject(p=>p.slots.C=999,'PLAYER_IDENTITY');reject(p=>p.slots.C=20,'NOT_OWNED');reject(p=>p.slots.C=7,'POSITION_MISMATCH');reject(p=>{p.slots.C=6;p.slots.G=null},'POSITION_MISMATCH');reject(p=>p.slots.D2=4,'DUPLICATE_SLOT');reject(p=>p.depth.D=[4,4],'DUPLICATE_DEPTH');reject(p=>{p.depth.LW=[1];p.depth.C=[]},'POSITION_MISMATCH');reject(p=>p.slots.extra=null,'INVALID_STRUCTURE');reject(p=>delete p.slots.G,'INVALID_STRUCTURE');reject(p=>p.depth.extra=[],'INVALID_STRUCTURE');reject(p=>p.depth.C='1','INVALID_DEPTH');reject(p=>p.formatVersion=2,'INVALID_PLAN');reject(p=>p.teamId=2,'TEAM_MISMATCH');reject(p=>p.slots.C={},'INVALID_ID');reject(p=>p.slots.C=' 1','INVALID_ID');reject(p=>p.slots.C=-1,'INVALID_ID');reject(p=>{},'PLAYER_IDENTITY',st=>st.universe.players.push({...st.universe.players[0]}));reject(p=>{},'INJURED',st=>st.activity.injuries.push({playerId:1,status:'active'}));reject(p=>{},'RETIRED',st=>st.universe.players[0].retired=true);reject(p=>{},'INVALID_RATING',st=>st.universe.players[0].overall=0);reject(p=>{},'INVALID_RATING',st=>delete st.universe.players[0].overall);reject(p=>{},'CONTRACT_REQUIRED',st=>st.activity.transactions.push({type:'drafted-prospect-signing',playerId:1,teamId:1}));
const recovered=state();recovered.activity.injuries=[{playerId:1,status:'recovered'}];a.deepEqual(api.validate(recovered,plan),plan);recovered.activity.injuries=[{playerId:1,active:false}];a.deepEqual(api.validate(recovered,plan),plan);
const goalie=state();goalie.universe.players[5].overall=0;a.equal(api.validate(goalie,plan).slots.G,6);delete goalie.universe.players[5].overall;a.equal(api.validate(goalie,plan).slots.G,6);
const goaliePreferenceRules=state();goaliePreferenceRules.activity.transactions=[{type:'drafted-prospect-signing',playerId:6,teamId:1}];a.equal(api.validate(goaliePreferenceRules,plan).slots.G,6);
const contracted=state();contracted.activity.transactions=[{type:'drafted-prospect-signing',playerId:1,teamId:1}];contracted.assets.contracts=[{playerId:1,teamId:1,status:'active'}];a.deepEqual(api.validate(contracted,plan),plan);
a.throws(()=>api.replacement(next,payload(plan)),e=>e.code==='NO_CHANGE');a.throws(()=>api.replacement(s,{...payload(plan),saveId:'other'}),e=>e.code==='IDENTITY_MISMATCH');a.throws(()=>api.replacement(s,{...payload(plan),teamId:2}),e=>e.code==='IDENTITY_MISMATCH');a.throws(()=>api.validate(s,null),e=>e.code==='INVALID_PLAN');
const corrupt=state();corrupt.extensions.phase11LineupPlan={formatVersion:2};a.throws(()=>api.replacement(corrupt,payload(plan)),e=>e.code==='INVALID_PLAN');
const noSave=state();delete noSave.meta.saveId;a.throws(()=>api.empty(noSave),e=>e.code==='INVALID_SAVE');
a.deepEqual(api.choices(s,'F').map(p=>p.id),[7]);a.deepEqual(api.choices(s,'D').map(p=>p.id),[4,5]);a.deepEqual(api.choices(s,'C').map(p=>p.id),[1,8]);a.equal(JSON.stringify(s),before);
function freeze(v){if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(freeze)}}const frozen=clone(s);freeze(frozen);a.deepEqual(api.validate(frozen,plan),plan);a.deepEqual(api.validate(s,plan),api.validate(s,plan));
const ambiguous=state();ambiguous.universe.players.push({...ambiguous.universe.players[0]});a.throws(()=>api.empty(ambiguous),e=>e.code==='PLAYER_IDENTITY');
// A2-38: stale saved references remain visible/editable, but proposed assignments stay strict.
for(const [code,change]of [
 ['INJURED',st=>st.activity.injuries.push({playerId:1,status:'active'})],
 ['NOT_OWNED',st=>st.universe.players[0].teamId=2],
 ['PLAYER_IDENTITY',st=>st.universe.players=st.universe.players.filter(p=>p.id!==1)],
 ['POSITION_MISMATCH',st=>st.universe.players[0].position='D'],
 ['RETIRED',st=>st.universe.players[0].retired=true],
 ['INVALID_RATING',st=>st.universe.players[0].overall=0],
 ['CONTRACT_REQUIRED',st=>st.activity.transactions.push({type:'drafted-prospect-signing',playerId:1,teamId:1})]
]){
 const changed=state();changed.extensions.phase11LineupPlan=clone(plan);change(changed);const bytes=JSON.stringify(changed);
 a.deepEqual(api.structure(changed,plan),plan);a.equal(api.inspect(changed,plan).eligible,false);
 a.throws(()=>api.replacement(changed,payload(plan)),e=>e.code===code);
 const cleared=api.empty(changed);const repaired=api.replacement(changed,payload(cleared));a.deepEqual(repaired.extensions.phase11LineupPlan,cleared);a.equal(JSON.stringify(changed),bytes);a.deepEqual(repaired.extensions.sentinel,changed.extensions.sentinel);
}
const injured=state();injured.extensions.phase11LineupPlan=clone(plan);injured.activity.injuries=[{playerId:1,status:'active'}];const corrected=clone(plan);corrected.slots.C=8;corrected.depth.C=[8];a.deepEqual(api.replacement(injured,payload(corrected)).extensions.phase11LineupPlan,corrected);a.equal(api.inspect(injured,plan).plan.slots.C,1);
const depthInjury=state();depthInjury.extensions.phase11LineupPlan=clone(plan);depthInjury.activity.injuries=[{playerId:8,status:'active'}];const fixedDepth=clone(plan);fixedDepth.depth.C=[1];a.deepEqual(api.replacement(depthInjury,payload(fixedDepth)).extensions.phase11LineupPlan,fixedDepth);a.throws(()=>api.replacement(depthInjury,payload(plan)),e=>e.code==='INJURED');
for(const corrupt of [p=>p.formatVersion=9,p=>delete p.slots.C,p=>p.slots.extra=null,p=>p.depth.C=null,p=>delete p.depth.F,p=>p.slots.D2=4,p=>p.depth.D=[4,4],p=>p.teamId=2,p=>p.slots.C={},p=>p.depth.extra=[]]){
 const changed=state();changed.extensions.phase11LineupPlan=clone(plan);corrupt(changed.extensions.phase11LineupPlan);a.throws(()=>api.replacement(changed,payload(api.empty(changed))));
}
// A2-49: project committed starting skaters only; preserve established roster order.
const deployState=clone(next),deployBytes=JSON.stringify(deployState),deployment=api.deployment(deployState);
a.deepEqual(deployment.playerIds,[1,2,3,4,5]);a.deepEqual(deployment.plan,plan);a.equal(deployment.saveId,s.meta.saveId);a.equal(deployment.teamId,'1');a.equal(JSON.stringify(deployState),deployBytes);
deployment.plan.slots.C=null;a.equal(deployState.extensions.phase11LineupPlan.slots.C,1);
const partial=clone(deployState);partial.extensions.phase11LineupPlan.slots.D1=null;partial.extensions.phase11LineupPlan.slots.D2=null;a.deepEqual(api.deployment(partial).playerIds,[1,2,3]);partial.extensions.phase11LineupPlan.slots.RW=null;a.throws(()=>api.deployment(partial),e=>e.code==='INSUFFICIENT_SKATERS');
a.throws(()=>api.deployment(state()),e=>e.code==='PLAN_UNAVAILABLE');
for(const [code,mutate]of [
 ['INJURED',st=>st.activity.injuries.push({playerId:1,status:'active'})],['NOT_OWNED',st=>st.universe.players[0].teamId=2],['PLAYER_IDENTITY',st=>st.universe.players.splice(0,1)],['POSITION_MISMATCH',st=>st.universe.players[0].position='F'],['RETIRED',st=>st.universe.players[0].retired=true],['CONTRACT_REQUIRED',st=>st.activity.transactions.push({type:'drafted-prospect-signing',playerId:1,teamId:1})],['INVALID_RATING',st=>st.universe.players[0].overall=0],['DUPLICATE_SLOT',st=>st.extensions.phase11LineupPlan.slots.D2=4],['PLAYER_IDENTITY',st=>st.universe.players.push(clone(st.universe.players[0]))],['INVALID_PLAN',st=>st.extensions.phase11LineupPlan.formatVersion=9],['TEAM_MISMATCH',st=>st.extensions.phase11LineupPlan.teamId=2]]){
 const st=clone(deployState);mutate(st);const bytes=JSON.stringify(st);a.throws(()=>api.deployment(st),e=>e.code===code);a.equal(JSON.stringify(st),bytes);
}
console.log(JSON.stringify({suite:'lineup planning validator',assertions,failed:0}));
