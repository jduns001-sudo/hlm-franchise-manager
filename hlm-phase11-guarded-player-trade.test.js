'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {review,createSession}=require('./hlm-phase11-guarded-player-trade');
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
const initial=()=>({meta:{controlledTeamId:1},universe:{teams:[{id:1},{id:2}],players:[{id:'a',teamId:1,name:'A'},{id:'b',teamId:2,name:'B'},{id:'c',teamId:1,name:'C'}]},activity:{games:[{id:10,status:'scheduled'}]},extensions:{unrelated:'unchanged'}});
function store(){const m=new Map([[KEY,JSON.stringify(initial())],['hlm_front_office_v8','PRODUCTION_SENTINEL']]);return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),snapshot:()=>new Map(m)}}
const swap={outgoingPlayerId:'a',incomingPlayerId:'b'};
test('source-backed proposal is pure and swaps only verified player team IDs',()=>{
 const before=initial(),serialized=JSON.stringify(before),r=review(before,swap);
 assert.equal(JSON.stringify(before),serialized);
 assert.equal(r.nextState.universe.players[0].teamId,2);
 assert.equal(r.nextState.universe.players[1].teamId,1);
 assert.deepEqual(r.nextState.universe.players[2],before.universe.players[2]);
 assert.deepEqual(r.nextState.activity,before.activity);
 assert.deepEqual(r.nextState.extensions,before.extensions);
});
test('rejects invented, duplicated, same-team, and uncontrolled player IDs',()=>{
 for(const bad of [{outgoingPlayerId:'x',incomingPlayerId:'b'},{outgoingPlayerId:'a',incomingPlayerId:'a'},{outgoingPlayerId:'a',incomingPlayerId:'c'},{outgoingPlayerId:'b',incomingPlayerId:'a'}])
  assert.throws(()=>review(initial(),bad));
 const duplicate=initial();duplicate.universe.players.push({...duplicate.universe.players[0]});
 assert.throws(()=>review(duplicate,swap));
});
test('decline and unreviewed approval never save',()=>{
 const s=store(),session=createSession(s,KEY),before=s.getItem(KEY);
 assert.throws(()=>session.approve(true));
 session.propose(swap);assert.throws(()=>session.approve(false));
 assert.equal(s.getItem(KEY),before);
 assert.equal(s.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
});
test('approved trade commits once and reload retains both ownership changes',()=>{
 const s=store(),session=createSession(s,KEY);
 session.propose(swap);session.approve(true);
 const restored=createSession(s,KEY).reload();
 assert.equal(restored.universe.players[0].teamId,2);
 assert.equal(restored.universe.players[1].teamId,1);
 assert.equal(s.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
});
test('stale two-tab review cannot overwrite authoritative save',()=>{
 const s=store(),first=createSession(s,KEY),second=createSession(s,KEY);
 first.propose(swap);second.propose(swap);first.approve(true);
 const authoritative=s.getItem(KEY);
 assert.throws(()=>second.approve(true),/Stale/);
 assert.equal(s.getItem(KEY),authoritative);
});
