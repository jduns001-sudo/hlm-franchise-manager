'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createFranchiseAIAnalysis}=require('./hlm-franchise-ai-analysis-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT',retired:false}],contracts:[{id:'C1',playerId:1,teamId:'PIT'}],draftPicks:[{pickId:'P1',ownerTeamId:'PIT'}],injuries:[{id:'I1',playerId:1,status:'Active'}]});
const before=JSON.stringify(state);const r=createFranchiseAIAnalysis(state,'PIT',{analysis:{roster:[{fact:'thin wing'}],cap:[{fact:'space'}],prospects:[{fact:'goalie'}],'organizational-needs':[{fact:'depth'}]},
 priorities:[{area:'roster'}],recommendations:[{type:'review'}],lineSuggestions:[{reason:'matchup'}]});
assert.strictEqual(r.facts.rosterCount,1);assert.strictEqual(r.facts.contractCount,1);assert.strictEqual(r.analysis.cap.length,1);
assert.strictEqual(r.lineSuggestions.silentLineupChangesAllowed,false);assert.strictEqual(r.authority.humanGMFinalDecision,true);assert.strictEqual(r.authority.automaticTransactions,false);
assert.strictEqual(r.generation.recommendationsGeneratedByFormula,false);assert.strictEqual(r.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Franchise AI analysis foundation tests passed.');
