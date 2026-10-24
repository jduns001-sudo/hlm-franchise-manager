'use strict';
const assert=require('node:assert/strict');
globalThis.indexedDB=require('fake-indexeddb').indexedDB;
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {listPlayers}=require('./hlm-phase11-m1568-trade-player-options');
function source(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},universe:{players:[{id:'pA',name:'Alex Source',teamId:'A'},{id:'pB',name:'Blair Source',teamId:'B'},{id:'missing',name:'No contract',teamId:'B'}],teams:[{id:'A',name:'Team A'},{id:'B',name:'Team B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
async function seed(name,state){const r=await store.commit({experimentalEnabled:true,syntheticTestAuthorization:true,gmApproved:true,expectedRevision:0,candidateState:state,eventId:'seed'},name);assert.equal(r.saved,true,r.code)}
(async()=>{
 const database='hlm-phase11-m1568-experimental-node-'+process.pid;
 const options={experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:database};
 assert.equal((await listPlayers()).code,'experiment-disabled');
 assert.equal((await listPlayers({...options,experimentalDatabaseName:'hlm_front_office_v8'})).code,'isolated-experimental-database-required');
 assert.equal((await listPlayers({...options,syntheticTestAuthorization:false})).ok,false);
 await seed(database,source());const before=await store.read(database);
 const result=await listPlayers(options);assert.equal(result.ok,true);assert.equal(result.revision,1);assert.equal(result.saved,false);
 assert.deepEqual(result.outgoing.map(x=>x.id),['pA']);assert.deepEqual(result.incoming.map(x=>x.id),['pB']);
 assert.match(result.outgoing[0].label,/Alex Source.*Team A.*pA/);
 assert.deepEqual(await store.read(database),before,'loading player choices never writes');
 result.outgoing[0].id='changed';assert.deepEqual(await store.read(database),before,'choices cannot mutate source');
 const duplicate=source();duplicate.assets.contracts.push({...duplicate.assets.contracts[0]});const duplicateName=database+'-contracts';await seed(duplicateName,duplicate);
 assert.deepEqual((await listPlayers({...options,experimentalDatabaseName:duplicateName})).outgoing,[],'ambiguous active contracts excluded');
 const mismatched=source();mismatched.assets.contracts[1].teamId='A';const mismatchName=database+'-mismatch';await seed(mismatchName,mismatched);
 assert.deepEqual((await listPlayers({...options,experimentalDatabaseName:mismatchName})).incoming,[],'mismatched contract ownership excluded');
 console.log('M1568 persisted player identity, team/contract ownership, no invented contracts and read-only choices passed');
})().catch(e=>{console.error(e);process.exitCode=1});
