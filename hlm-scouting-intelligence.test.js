'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-scouting-intelligence');
const state=createGameStateEnvelope({prospects:[{id:'pr1'}]});const before=JSON.stringify(state);const scout=x.createScoutProfile(state,{scoutId:'s1',personality:'analytics'});
const a=x.createScoutingReport(state,{prospectId:'pr1',scoutId:'s1',estimatedAbilityRange:{low:60,high:70},confidence:90,projection:'caller A'});
const b=x.createScoutingReport(state,{prospectId:'pr1',scoutId:'s2',estimatedAbilityRange:{low:50,high:65},confidence:35,projection:'caller B'});
const c=x.compareScoutReports([a,b]);assert.strictEqual(a.actualAbilityExposed,false);assert.strictEqual(a.generatedFromFormula,false);assert.strictEqual(c.scoutCount,2);assert.strictEqual(c.disagreementRetained,true);assert.strictEqual(c.consensusForced,false);
const info=x.createScoutingInformationContext({competitionLevel:'caller',availableScoutingData:'caller'});assert.strictEqual(info.exposureAffectsInformationQuality,true);assert.strictEqual(info.calculationPerformed,false);assert.strictEqual(JSON.stringify(state),before);assert.strictEqual(scout.scoutId,'s1');
console.log('Scouting intelligence tests passed.');
