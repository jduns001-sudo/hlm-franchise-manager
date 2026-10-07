'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-phase8-integration-gate');
const state=createGameStateEnvelope({players:[{id:7,ovr:99,potential:99}],prospects:[{id:'role7',playerId:7,draftYear:2027}],draftPicks:[{pickId:'d1',originalTeamId:1,currentOwnerId:2}]});const before=JSON.stringify(state);
const identity=x.resolveCanonicalProspect(state,7);assert.strictEqual(identity.canonicalPlayerId,7);assert.strictEqual(identity.resolved,true);
const view=x.createTeamFacingProspectView(state,7,{display:{name:'Prospect'},scouting:{confidence:'caller'}});assert.strictEqual(view.actualAbility,null);assert.strictEqual(view.actualPotential,null);assert.strictEqual(view.hiddenRealityExposed,false);assert.strictEqual(JSON.stringify(view).includes('99'),false);
assert.strictEqual(x.validateDraftBoardTags(['Target','Rising']).valid,true);assert.strictEqual(x.validateDraftBoardTags(['Invented']).valid,false);
const gate=x.createPhase8IntegrationGate(state,{pickId:'d1',selectingTeamId:2,draftBoardTags:['Target'],teamFacingProspectView:view,prospectIdentity:identity,sourceGameStateProtected:true,noPersistencePerformed:true});assert.strictEqual(gate.passed,true);assert.strictEqual(gate.nextPhase,9);assert.strictEqual(JSON.stringify(state),before);
console.log('Phase 8 hardening/integration tests passed.');
