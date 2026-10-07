'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createOrganizationLeadershipSnapshot}=require('./hlm-organization-leadership-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'}]});const before=JSON.stringify(state);
const r=createOrganizationLeadershipSnapshot(state,'PIT',{philosophy:'Win Now',ownerExpectations:[{area:'winning',expectation:'caller-supplied'},{area:'development',expectation:'caller-supplied'}],
 gmReputation:{value:'caller-supplied'},gmCareer:[{season:2026,event:'hired'}],decisionHistory:[{type:'contract',seasonId:2026}]});
assert.strictEqual(r.philosophy.valid,true);assert.strictEqual(r.owner.expectations[0].validArea,true);assert.strictEqual(r.gm.employmentDecisionPerformed,false);
assert.strictEqual(r.decisionHistory.appendOnlyRequired,true);assert.strictEqual(r.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
const bad=createOrganizationLeadershipSnapshot(state,'PIT',{philosophy:'Invented',ownerExpectations:[{area:'invented'}]});
assert.strictEqual(bad.philosophy.valid,false);assert.strictEqual(bad.owner.expectations[0].validArea,false);
console.log('Organization leadership foundation tests passed.');
