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
test('approved proposal remains blocked until financial and receiving-team consent checks exist',()=>{
 const s=store(),session=createSession(s,KEY),before=s.getItem(KEY);
 session.propose(swap);
 assert.throws(()=>session.approve(true),/Trade settlement disabled/);
 assert.equal(s.getItem(KEY),before);
 assert.equal(s.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
});
test('stale two-tab review cannot overwrite a newer isolated save',()=>{
 const s=store(),first=createSession(s,KEY),second=createSession(s,KEY);
 first.propose(swap);second.propose(swap);
 const changed=initial();changed.meta.currentDate='2026-10-22';
 s.setItem(KEY,JSON.stringify(changed));
 const authoritative=s.getItem(KEY);
 assert.throws(()=>first.approve(true),/Stale/);
 assert.throws(()=>second.approve(true),/Stale/);
 assert.equal(s.getItem(KEY),authoritative);
});

test('hypothetical player swap never changes authoritative contracts or saves',()=>{
 const s=store(),before=s.snapshot(),state=initial();
 state.assets={contracts:[{playerId:'a',teamId:1,status:'active'},{playerId:'b',teamId:2,status:'active'}]};
 const result=review(state,swap);
 assert.equal(result.nextState.universe.players[0].teamId,2);
 assert.equal(result.nextState.assets.contracts[0].teamId,1);
 assert.equal(result.nextState.assets.contracts[1].teamId,2);
 assert.deepEqual(s.snapshot(),before);
 const session=createSession(s,KEY);session.propose(swap);
 assert.throws(()=>session.approve(true),/settlement disabled/);
 assert.deepEqual(s.snapshot(),before);
});
test('production key is rejected and never read or written',()=>{
 let reads=0,writes=0;
 const storage={getItem(){reads++;return '{}'},setItem(){writes++}};
 assert.throws(()=>createSession(storage,'hlm_front_office_v8'),/isolated storage/);
 assert.equal(reads,0);assert.equal(writes,0);
});
test('reload invalidates pending review; repeat approval and decline never save',()=>{
 const s=store(),session=createSession(s,KEY),before=s.snapshot();
 session.propose(swap);session.reload();
 assert.throws(()=>session.approve(true),/Review trade first/);
 session.propose(swap);assert.throws(()=>session.approve(false),/approval required/);
 assert.throws(()=>session.approve(true),/Review trade first|settlement disabled/);
 assert.throws(()=>session.approve(true),/Review trade first/);
 assert.deepEqual(s.snapshot(),before);
});
test('receiving team consent cannot be inferred or authorize settlement',()=>{
 const s=store(),session=createSession(s,KEY),before=s.snapshot();
 for(const consent of [undefined,false,true,'approved']){
  session.reload();session.propose({...swap,receivingTeamConsent:consent});
  assert.throws(()=>session.approve(true),/settlement disabled/);
  assert.deepEqual(s.snapshot(),before);
 }
});
test('multi-season isolated save remains unchanged across blocked approval and reload',()=>{
 const s=store(),state=initial();
 state.meta.season=2034;
 state.history={seasons:[{year:2032,champion:1},{year:2033,champion:2}]};
 state.assets={contracts:[{playerId:'a',teamId:1,expires:2036},{playerId:'b',teamId:2,expires:2035}]};
 s.setItem(KEY,JSON.stringify(state));
 const before=s.snapshot(),session=createSession(s,KEY);
 session.propose(swap);assert.throws(()=>session.approve(true),/settlement disabled/);
 assert.deepEqual(session.reload(),state);
 assert.deepEqual(s.snapshot(),before);
});
