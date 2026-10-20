'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('hlm-phase10-free-agent-signing.js','utf8');
const bundle=fs.readFileSync('hlm-phase10-browser.bundle.js','utf8');
const name='"hlm-phase10-free-agent-signing.js":function(module,exports,require){\n';
const start=bundle.indexOf(name);
assert.ok(start>=0,'bundle must include signing source module');
const end=bundle.indexOf('\n},',start);
assert.ok(end>start,'bundle module boundary');
assert.equal(bundle.slice(start+name.length,end).trim(),source.trim(),'browser module must exactly match reviewed Node source');
const context={};vm.createContext(context);vm.runInContext(bundle,context);
const api=context.HLMPhase10;
assert.equal(typeof api.completeOffseasonAndStartSeason,'function');
const {createGameStateEnvelope}=require('./hlm-game-state');
const state=createGameStateEnvelope({meta:{controlledTeamId:5,currentDate:'2026-10-18'},teams:[{id:5,name:'Pittsburgh'},{id:3,name:'New York'}],games:[]});
state.universe.players.push({id:'m1394-fa',name:'FA',teamId:3});
state.universe.prospects.push({id:'m1394-prospect',name:'Prospect'});
state.assets.contracts.push({contractId:'m1394-old',playerId:'m1394-fa',teamId:3,aav:1000000,years:1,season:'2026-27',status:'active'});
state.assets.draftPicks.push({pickId:'m1394-pick',currentOwnerId:5,status:'available'});
const before=JSON.stringify(state);
const result=api.completeOffseasonAndStartSeason(state,{
 contracts:{expiredContractIds:['m1394-old'],signings:[{playerId:'m1394-fa',teamId:5,contractId:'m1394-new',aav:1500000,years:3,season:'2027-28',capLimit:1000000000}]},
 draftSelections:[{pickId:'m1394-pick',prospectId:'m1394-prospect',teamId:5}],
 nextSeason:{completedSeasonId:'2026-27',nextSeasonId:'2027-28',startDate:'2027-10-01',cycles:2}
});
assert.equal(JSON.stringify(state),before,'previous franchise state unchanged');
assert.equal(result.nextState.universe.players.find(p=>p.id==='m1394-fa').teamId,5);
assert.equal(result.nextState.assets.contracts.find(c=>c.contractId==='m1394-old').status,'expired');
assert.equal(result.nextState.assets.contracts.find(c=>c.contractId==='m1394-new').status,'active');
assert.equal(result.nextState.assets.draftPicks.find(p=>p.pickId==='m1394-pick').status,'used');
assert.equal(result.nextState.universe.prospects.find(p=>p.id==='m1394-prospect').draftedByTeamId,5);
console.log('Mission 1394: bundle source parity and real GM-approved roster movement passed');
