'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-draft-scouting-foundation');
const state=createGameStateEnvelope({prospects:[{id:'pr1',name:'Prospect One'}]});const before=JSON.stringify(state),out=x.createDraftScoutingFoundation(state);
assert.deepStrictEqual([...x.SCOUT_ATTRIBUTES],['current-ability-accuracy','potential-accuracy','region','league','position-specialization','knowledge']);
assert.deepStrictEqual([...x.SCOUT_PERSONALITIES],['traditional','analytics','skill-focused','defensive']);
assert.deepStrictEqual([...x.CPU_DRAFT_FACTORS],['needs','philosophy','scouting','personality','position','potential','development','risk']);
assert.strictEqual(out.principles.hiddenActualAbility,true);assert.strictEqual(out.principles.imperfectScoutingEstimates,true);assert.strictEqual(out.principles.highestOverallOnlyDrafting,false);assert.strictEqual(out.actualAbilityExposedToTeam,false);assert.strictEqual(out.draftPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Draft and scouting foundation tests passed.');
