'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createContractCapPlanningSnapshot}=require('./hlm-contract-cap-planning-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT'}],contracts:[{id:'C1',playerId:1,teamId:'PIT',aav:5000000,years:2,season:2026,status:'Active'}],
 finances:{pit2026:{teamId:'PIT',seasonId:2026,capLimit:90000000,payroll:85000000}}});
const before=JSON.stringify(state);const r=createContractCapPlanningSnapshot(state,'PIT',{seasonId:2026,futureCommitments:[{season:2027,amount:5000000}],expiringContracts:[{contractId:'C1'}],projectedRaises:[{playerId:1}],rosterNeeds:['goalie'],prospects:[{playerId:2}]});
assert.strictEqual(r.contracts.length,1);assert.strictEqual(r.cap.capLimit,90000000);assert.strictEqual(r.cap.payroll,85000000);assert.strictEqual(r.cap.availableSpace,5000000);
assert.strictEqual(r.rules.hardCodedLeagueRules,false);assert.strictEqual(r.futurePlanning.projectedSpace,null);assert.strictEqual(r.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
const noFinance=createContractCapPlanningSnapshot(state,'PIT',{seasonId:2027});assert.strictEqual(noFinance.cap.availableSpace,null);assert.strictEqual(noFinance.cap.calculationPerformed,false);
console.log('Contract and cap planning foundation tests passed.');
