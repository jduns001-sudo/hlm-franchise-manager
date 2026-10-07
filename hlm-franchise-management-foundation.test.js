'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');
const {ROLE_TYPES,createFranchiseManagementSnapshot}=require('./hlm-franchise-management-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'},{id:'BUF',name:'Buffalo'}],players:[{id:'p1',teamId:'PIT',position:'C'},{id:'p2',teamId:'BUF',position:'G'},{id:'p3',teamId:'PIT',retired:true}],contracts:[{id:'c1',playerId:'p1',teamId:'PIT'}],draftPicks:[{id:'d1',ownerTeamId:'PIT'}],injuries:[{id:'i1',playerId:'p1'}]});
const before=JSON.stringify(state);const s=createFranchiseManagementSnapshot(state,'PIT');
assert.strictEqual(JSON.stringify(state),before);assert.strictEqual(s.teamId,'PIT');assert.deepStrictEqual(s.roster.map(x=>x.id),['p1']);assert.deepStrictEqual(s.contracts.map(x=>x.id),['c1']);assert.deepStrictEqual(s.draftPicks.map(x=>x.id),['d1']);assert.deepStrictEqual(s.injuries.map(x=>x.id),['i1']);
assert.ok(ROLE_TYPES.includes('Franchise'));assert.ok(ROLE_TYPES.includes('Starter'));assert.strictEqual(s.persistencePerformed,false);
assert.throws(()=>createFranchiseManagementSnapshot(state,'XXX'),e=>e.code==='FRANCHISE_TEAM_NOT_FOUND');
console.log('Franchise management foundation tests passed.');
