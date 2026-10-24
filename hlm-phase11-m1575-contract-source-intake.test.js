'use strict';
const assert=require('node:assert/strict');
const {create}=require('./hlm-phase11-m1575-contract-source-intake');
const universe=require('./hlm-universe.json');
const {build}=require('./hlm-phase11-new-franchise');
const {create:season}=require('./hlm-phase11-isolated-single-game');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule'),...require('./hlm-phase10-browser-storage'),
 ...require('./hlm-phase10-apply-game'),...require('./hlm-phase10-standings'),...require('./hlm-phase10-simulate-day')};
const storageMap=new Map([['hlm_front_office_v8','PRODUCTION_SENTINEL']]);
const storage={getItem:key=>storageMap.get(key)??null,setItem:(key,value)=>storageMap.set(key,value)};
const manager=season(engine,storage);
const intake=create(()=>manager.peek());
assert.throws(()=>intake.begin(),/saved isolated franchise/);
manager.stage(build(universe,5,engine),true);
const saved=manager.peek(),owned=saved.universe.players.find(p=>String(p.teamId)==='5');
const away=saved.universe.players.find(p=>String(p.teamId)!=='5');
const source={publisher:'User-provided reference (NOT authenticated)',reference:'document-1',asOfDate:'2026-10-24'};
const entry=(p,id)=>({contractId:id,playerId:p.id,teamId:p.teamId,status:'active',aav:1000000,tradePermission:'unknown'});
const realDoc={schemaVersion:1,source,scope:{teamIds:[owned.teamId,away.teamId]},contracts:[entry(owned,'owned-1'),entry(away,'away-1')],
 sourcePublisherAuthenticated:true,tradeApproved:true};
const original=storage.getItem(manager.key);
intake.begin();
const check=intake.preview(realDoc);
assert.equal(check.identityMatched,true);
assert.equal(check.sourcePublisherAuthenticated,false,'caller cannot assert trusted provenance');
assert.equal(check.contractsImported,false);assert.equal(check.saved,false);
assert.equal(check.settlementAuthorized,false);assert.equal(check.cpuConsentAuthenticated,false);
assert.equal(check.evidenceCompleteForDeclaredScope,false,'partial real roster never becomes full evidence');
assert.ok(check.missingCoveredRosterCount>0);
assert.equal(check.matchedContractCount,2);
assert.equal(saved.assets.contracts.length,0,'real franchise must not acquire invented contracts');
assert.equal(storage.getItem(manager.key),original);
assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
const synthetic=()=>({meta:{controlledTeamId:'A',revision:1},universe:{teams:[{id:'A'},{id:'B'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[]}});
let state=synthetic();
const reviewer=create(()=>state);
const doc=()=>({schemaVersion:1,source:{publisher:'unverified demo',reference:'test-file',asOfDate:'2026-10-24'},
 scope:{teamIds:['A','B']},contracts:[{contractId:'a1',playerId:'a',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {contractId:'b1',playerId:'b',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}]});
reviewer.begin();
const full=reviewer.preview(doc());
assert.equal(full.evidenceCompleteForDeclaredScope,true);
assert.equal(full.sourcePublisherAuthenticated,false);
assert.equal(full.contractsImported,false);
assert.deepEqual(state,synthetic(),'preview leaves supplied GameState unchanged');
function reject(mutate,part){
 state=synthetic();reviewer.begin();const d=doc();mutate(d,state);
 assert.throws(()=>reviewer.preview(d),part);
}
reject(d=>d.contracts.push({...d.contracts[0],contractId:'duplicate'}),/Duplicate supplied/);
reject(d=>d.contracts.push({...d.contracts[0]}),/Duplicate supplied/);
reject(d=>d.contracts[0].playerId='unknown',/player absent|player absent|player absent|player absent|Contract player absent/);
reject(d=>d.contracts[0].teamId='B',/ownership mismatched/);
reject(d=>d.contracts[0].aav=-1,/Invalid supplied/);
reject(d=>d.contracts[0].aav='4',/Invalid supplied/);
reject(d=>d.contracts[0].status='inactive',/Invalid supplied/);
reject(d=>d.scope.teamIds.push('A'),/repeated source coverage team/);
reject(d=>d.scope.teamIds=['A'],/outside declared coverage/);
reject(d=>d.source.asOfDate='2026-02-31',/Source publisher/);
reject(d=>d.source.publisher='',/Source publisher/);
reject(d=>d.contracts[0].tradePermission='invented-allowed',/Invalid supplied/);
state=synthetic();reviewer.begin();let incomplete=doc();
incomplete.contracts[0].tradePermission='unknown';
assert.equal(reviewer.preview(incomplete).evidenceCompleteForDeclaredScope,false);
state=synthetic();state.assets.contracts=[{contractId:'other',playerId:'a',teamId:'A',status:'active',aav:4}];
reviewer.begin();
assert.match(reviewer.preview(doc()).blockers.join(';'),/conflicts with saved active contract/);
state=synthetic();reviewer.begin();state.meta.revision++;
assert.throws(()=>reviewer.preview(doc()),/Saved season changed/);
assert.throws(()=>reviewer.preview(doc()),/Refresh/);
state=synthetic();reviewer.begin();reviewer.discard();
assert.throws(()=>reviewer.preview(doc()),/Refresh/);
assert.equal(storage.getItem(manager.key),original,'experimental external intake cannot change saved starter franchise');
assert.equal(storageMap.size,2,'no new storage key or experimental database introduced');
console.log('M1575 source intake: real 32-team identity match, honest incomplete coverage, source fields untrusted, validation rejects bad identity/duplicates/ownership/cap/date/permissions, conflict, stale, discard, no-save, production isolation passed');
