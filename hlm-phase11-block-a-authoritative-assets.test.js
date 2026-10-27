'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {audit}=require('./hlm-phase11-block-a-authoritative-assets');
test('verified identities inventory does not invent contract, prospect or CPU consent readiness',()=>{
 const source={teams:[{id:1}],players:[{id:'p1'}]};
 const state={universe:{players:[{id:'p1'}],prospects:[]},assets:{draftPicks:[{pickId:'DP-1',source:'hlm-universe.json'}],contracts:[]}};
 const before=JSON.stringify(state),result=audit(source,state);
 assert.equal(result.status,'inventory-only');
 assert.deepEqual(result.counts,{players:1,picks:1,contracts:0,prospects:0});
 assert.equal(result.readiness.contractGameplay,false);
 assert.equal(result.readiness.prospectGameplay,false);
 assert.equal(result.readiness.cpuConsent,false);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.saved,false);
 assert.equal(JSON.stringify(state),before);
});
test('reject duplicate/unverified assets and preserve state',()=>{
 const source={teams:[{id:1}],players:[{id:'p1'}]};
 const state={universe:{players:[{id:'p1'},{id:'p1'},{id:'invented'}],prospects:[]},assets:{draftPicks:[{pickId:'x',source:'unknown'},{pickId:'x',source:'hlm-universe.json'}],contracts:[]}};
 const before=JSON.stringify(state),result=audit(source,state);
 assert.equal(result.status,'blocked');
 assert.deepEqual(result.issues.map(x=>x.code),['duplicate-player','unverified-player','unverified-pick','duplicate-pick']);
 assert.equal(JSON.stringify(state),before);
});
