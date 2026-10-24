'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {evidence}=require('./hlm-phase11-m1561-browser-trade-provenance');
const {settleBrowserVerifiedSyntheticTrade:settle}=require('./hlm-phase11-m1562-browser-indexeddb-trade-settlement');
function state(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
const input={outgoingPlayerId:'pA',incomingPlayerId:'pB',gmApproved:true,expectedGameRevision:1};
const options={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,eventId:'m1562_synthetic',experimentalDatabaseName:'hlm-phase11-m1562-experimental-test',cryptoApi:crypto.webcrypto,expectedGameRevision:1};
test('valid browser provenance reaches synthetic settlement but never production authorization',async()=>{
 const s=state(),proof=await evidence(s,input,options);assert.equal(proof.ok,true,proof.code);
 const result=await settle(s,input,proof,options);
 assert.equal(result.settlementAuthorized,false);assert.equal(result.cpuConsentAuthenticated,false);
 assert.equal(result.saved,false,'Node without IndexedDB must not fall back to production persistence');
});
test('tampered, stale, cancelled, declined and disabled requests fail without saving',async()=>{
 const s=state(),proof=await evidence(s,input,options);
 const cases=[
  [s,input,{...proof,digest:'0'.repeat(64)},options],
  [s,{...input,expectedGameRevision:2},proof,options],
  [s,input,proof,{...options,cancelled:true}],
  [s,input,proof,{...options,declined:true}],
  [s,input,proof,{...options,experimentalEnabled:false}],
  [s,input,proof,{...options,gmApproved:false}],
  [s,input,proof,{...options,realTradeSettlement:true}],
  [s,input,proof,{...options,syntheticTestAuthorization:false}]
 ];
 for(const [a,b,c,d] of cases){const before=JSON.stringify(a),r=await settle(a,b,c,d);assert.equal(r.saved,false,r.code);assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(a),before)}
});
