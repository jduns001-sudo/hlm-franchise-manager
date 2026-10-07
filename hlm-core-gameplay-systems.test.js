'use strict';
const assert=require('assert');
const {createCoreGameplayProfile,resolveDeterministicUnit,createGameplayEventBoundary}=require('./hlm-core-gameplay-systems');
const profile=createCoreGameplayProfile({skating:80,passing:78,puckControl:82,defensivePressure:75,faceoffs:70,coaching:77,matchup:76,fatigue:20,
 shootingSkill:84,accuracy:81,shotPower:79,positionQuality:80,passingSupport:78,pressure:65,confidence:83,goalieQuality:86,
 reflexes:88,goaliePositioning:85,reboundControl:82,goalieConsistency:80,goalieFatigue:10,goalieConfidence:84,defensiveSupport:79,shotQuality:90});
assert.strictEqual(profile.chanceTypes.length,9);
assert.ok(profile.derived.possessionReadiness>0);assert.ok(profile.derived.shootingReadiness>0);assert.ok(profile.derived.goaltendingReadiness>0);
assert.strictEqual(profile.probabilitiesApplied,false);assert.strictEqual(profile.eventsGenerated,false);
const a=resolveDeterministicUnit('g1','event-1'),b=resolveDeterministicUnit('g1','event-1');
assert.strictEqual(a,b);assert.ok(a>=0&&a<=1);
const boundary=createGameplayEventBoundary(profile,{seed:'g1',eventKey:'event-1'});
assert.strictEqual(boundary.deterministicUnit,a);assert.strictEqual(boundary.goal,null);assert.strictEqual(boundary.eventGenerated,false);
console.log('Core gameplay systems tests passed.');
