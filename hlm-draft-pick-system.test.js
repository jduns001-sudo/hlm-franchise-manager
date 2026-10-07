'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-draft-pick-system');
const state=createGameStateEnvelope({draftPicks:[{pickId:'DP-0-2027-1-1-1',originalTeamId:1,currentOwnerId:2,protection:'caller',conditions:'caller'}]});const before=JSON.stringify(state);
const o=x.createDraftPickOwnershipView(state,'DP-0-2027-1-1-1');assert.strictEqual(o.originalTeamId,1);assert.strictEqual(o.currentOwnerId,2);assert.strictEqual(o.originalOwnerImmutable,true);assert.strictEqual(o.currentOwnerSelects,true);
assert.strictEqual(x.verifyDraftPickOwnership(state,o.pickId,2).verified,true);assert.strictEqual(x.verifyDraftPickOwnership(state,o.pickId,1).verified,false);
const l=x.createDraftLotteryContext(state,{eligiblePickIds:[o.pickId]});assert.strictEqual(l.lotteryPerformed,false);assert.strictEqual(l.lotteryDeterminesDraftOrder,true);
const p=x.createDraftProtectionContext(state,o.pickId);assert.strictEqual(p.resolutionPerformed,false);assert.strictEqual(p.canTransferOrRollover,true);assert.strictEqual(JSON.stringify(state),before);
console.log('Draft lottery/pick ownership/protection tests passed.');
