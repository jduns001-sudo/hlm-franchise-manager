'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-draft-day');
const state=createGameStateEnvelope({prospects:[{id:'p1'}],draftPicks:[{pickId:'pick1',originalTeamId:1,currentOwnerId:1}]});const before=JSON.stringify(state);
const d=x.createDraftDayContext(state,{currentPickId:'pick1',availableProspectIds:['p1'],draftBoard:[{prospectId:'p1'}],tradeOffers:[{id:'o1'}],timeContext:'caller',eventContext:'caller'});assert.strictEqual(d.selectionPerformed,false);
const e=x.createCpuDraftEvaluation(state,{teamId:1,prospectId:'p1',factors:{needs:'caller',risk:'caller'}});assert.deepStrictEqual(Object.keys(e.factors),x.CPU_DRAFT_FACTORS);assert.strictEqual(e.highestOverallOnly,false);assert.strictEqual(e.formulaApplied,false);
const c=x.createDraftSelectionCandidate(state,{pickId:'pick1',prospectId:'p1',teamId:1,ownershipVerified:true,prospectAvailable:true});assert.strictEqual(c.ready,true);assert.strictEqual(c.executed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Draft day and CPU drafting tests passed.');
