'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');
const {createRosterConfigurationSnapshot,createPlayerRelationshipSnapshot}=require('./hlm-roster-configuration-relationships-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:'c',teamId:'PIT'},{id:'d',teamId:'PIT'},{id:'g',teamId:'PIT'},{id:'i',teamId:'PIT'}],
 injuries:[{id:'inj',playerId:'i',startDate:'2026-10-01',severity:'Minor',status:'Active'}]});
const before=JSON.stringify(state);
const cfg=createRosterConfigurationSnapshot(state,'PIT',{depthChart:{centers:['c'],defense:['d'],goalies:['g'],organizational:['i']},
 lines:{forwards:[['c']],defense:[['d']],powerPlay:[['c','d']],penaltyKill:[['c','d']],extraAttacker:[['c']],shootout:[['c']]}});
assert.strictEqual(cfg.validation.valid,true);assert.strictEqual(cfg.aiLineSuggestions.silentLineupChangesAllowed,false);
const bad=createRosterConfigurationSnapshot(state,'PIT',{lines:{forwards:[['i','missing']]}});
assert.deepStrictEqual(bad.validation.unknownPlayerIds,['missing']);assert.deepStrictEqual(bad.validation.unavailableLineupPlayerIds,['i']);
const rel=createPlayerRelationshipSnapshot(state,'PIT',{roleAssignments:[{playerId:'c',role:'Top-Six'}],
 promises:[{playerId:'c',type:'ice-time',status:'active'}],trust:[{playerId:'c',value:'caller-supplied'}]});
assert.strictEqual(rel.roleAssignments[0].validRole,true);assert.strictEqual(rel.promises[0].validType,true);
assert.strictEqual(rel.trustCalculationPerformed,false);assert.strictEqual(rel.brokenPromisesAffectTrust,true);
assert.strictEqual(JSON.stringify(state),before);assert.strictEqual(cfg.persistencePerformed,false);assert.strictEqual(rel.persistencePerformed,false);
console.log('Roster configuration and player relationship foundation tests passed.');
