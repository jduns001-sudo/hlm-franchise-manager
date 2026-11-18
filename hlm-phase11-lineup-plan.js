/* Saved planning only: no storage, game commands, or participation authorization. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMLineupPlan=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const slots=Object.freeze({C:'C',LW:'LW',RW:'RW',D1:'D',D2:'D',G:'G'});
const groups=Object.freeze(['C','LW','RW','D','F','G']);
const clone=x=>JSON.parse(JSON.stringify(x));
function fail(code,message){throw Object.assign(new Error(message),{code});}
function id(x){if(typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=128)return x;if(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)return String(x);fail('INVALID_ID','A bounded permanent saved ID is required');}
function keys(x,expected){return !!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...expected].sort().join('|');}
function authority(state){
 if(!state||typeof state.meta?.saveId!=='string'||!state.meta.saveId.trim()||state.meta.saveId.length>128)fail('INVALID_SAVE','Explicit saved franchise identity required');
 const team=id(state.meta.controlledTeamId);
 if(!Array.isArray(state.universe?.teams)||state.universe.teams.filter(t=>t&&id(t.id)===team).length!==1||!Array.isArray(state.universe?.players)||!Array.isArray(state.activity?.injuries))fail('INVALID_STATE','Unambiguous controlled franchise and saved roster required');
 const seen=new Set();for(const p of state.universe.players){if(!p||typeof p!=='object')fail('INVALID_STATE','Malformed saved player');const key=id(p.id);if(seen.has(key))fail('PLAYER_IDENTITY','Duplicate roster identity: '+key);seen.add(key);}
 return {saveId:state.meta.saveId,teamId:team};
}
function player(state,value,position,a=authority(state)){
 const team=a.teamId,key=id(value),matches=state.universe.players.filter(p=>p&&id(p.id)===key);
 if(matches.length!==1)fail('PLAYER_IDENTITY','Player missing or ambiguous: '+key);
 const p=matches[0];if(id(p.teamId)!==team)fail('NOT_OWNED','Player is not on the controlled-team roster: '+key);
 const pos=typeof p.position==='string'?p.position.toUpperCase():'';
 if(pos!==position||!groups.includes(pos))fail('POSITION_MISMATCH','Saved scalar position does not match '+position+': '+key);
 if(p.retired===true)fail('RETIRED','Retired player: '+key);
 if(state.activity.injuries.some(i=>i&&String(i.playerId)===key&&i.active!==false&&i.status!=='resolved'&&i.status!=='recovered'))fail('INJURED','Unresolved injury: '+key);
 // S182 skater readiness requires 1–99; goalie preference has no rating requirement.
 if(pos!=='G'){const rating=p.overall??p.ovr;if(!Number.isSafeInteger(rating)||rating<1||rating>99)fail('INVALID_RATING','Rated skater required: '+key);}
 const signed=(state.activity.transactions||[]).some(t=>t?.type==='drafted-prospect-signing'&&String(t.playerId)===key&&String(t.teamId)===team);
 if(pos!=='G'&&signed&&!(state.assets?.contracts||[]).some(c=>String(c.playerId)===key&&String(c.teamId)===team&&c.status==='active'))fail('CONTRACT_REQUIRED','Signed prospect lacks active controlled-team contract: '+key);
 return p;
}
function empty(state){authority(state);return {formatVersion:1,teamId:state.meta.controlledTeamId,slots:Object.fromEntries(Object.keys(slots).map(k=>[k,null])),depth:Object.fromEntries(groups.map(k=>[k,[]]))};}
// Structure is independent of current roster eligibility: stale references must remain editable.
function structure(state,plan){
 const a=authority(state);
 if(!keys(plan,['formatVersion','teamId','slots','depth'])||plan.formatVersion!==1)fail('INVALID_PLAN','Exact version-1 lineup plan required');
 if(id(plan.teamId)!==a.teamId)fail('TEAM_MISMATCH','Lineup team differs from controlled franchise');
 if(!keys(plan.slots,Object.keys(slots))||!keys(plan.depth,groups))fail('INVALID_STRUCTURE','All supported slots and depth groups are required');
 const out={formatVersion:1,teamId:plan.teamId,slots:{},depth:{}},used=new Set();
 for(const slot of Object.keys(slots)){const value=plan.slots[slot];if(value!==null){const key=id(value);if(used.has(key))fail('DUPLICATE_SLOT','Repeated starting player: '+key);used.add(key);}out.slots[slot]=value;}
 const depthIds=new Set();for(const pos of groups){if(!Array.isArray(plan.depth[pos]))fail('INVALID_DEPTH','Depth array required: '+pos);out.depth[pos]=plan.depth[pos].map(value=>{const key=id(value);if(depthIds.has(key))fail('DUPLICATE_DEPTH','Repeated depth player: '+key);depthIds.add(key);return value;});}
 return out;
}
function validate(state,plan){
 const out=structure(state,plan),a=authority(state);out.teamId=state.meta.controlledTeamId;
 for(const [slot,pos]of Object.entries(slots))if(out.slots[slot]!==null)out.slots[slot]=player(state,out.slots[slot],pos,a).id;
 for(const pos of groups){if(out.depth[pos].length>state.universe.players.length)fail('INVALID_DEPTH','Bounded depth array required: '+pos);out.depth[pos]=out.depth[pos].map(value=>player(state,value,pos,a).id);}
 return out;
}
function inspect(state,plan){
 const saved=structure(state,plan),a=authority(state),issues=[];
 for(const [location,value,pos]of [...Object.entries(slots).map(([slot,pos])=>['Starting '+slot,saved.slots[slot],pos]),...groups.flatMap(pos=>saved.depth[pos].map(value=>[pos+' depth',value,pos]))]){
  if(value===null)continue;try{player(state,value,pos,a)}catch(e){issues.push(location+' | '+value+' | '+e.code+': '+e.message);}
 }
 return {plan:saved,eligible:issues.length===0,issues};
}
function replacement(state,payload){
 const a=authority(state);if(!keys(payload,['saveId','teamId','plan'])||payload.saveId!==a.saveId||id(payload.teamId)!==a.teamId)fail('IDENTITY_MISMATCH','Reviewed save and team identity must match');
 const current=state.extensions?.phase11LineupPlan;
 const existing=current===undefined?null:structure(state,current); // Malformed plans remain blocked; stale eligibility does not block correction.
 const plan=validate(state,payload.plan);
 if(existing&&JSON.stringify(existing)===JSON.stringify(plan))fail('NO_CHANGE','Lineup plan has no changes');
 return {...state,extensions:{...state.extensions,phase11LineupPlan:clone(plan)}};
}
function choices(state,position){const a=authority(state);return state.universe.players.filter(p=>{try{player(state,p.id,position,a);return true}catch{return false}}).map(p=>({id:p.id,name:typeof p.name==='string'?p.name:String(p.id),position:p.position}));}
return Object.freeze({slots,groups,id,authority,empty,structure,inspect,validate,replacement,choices});
});
