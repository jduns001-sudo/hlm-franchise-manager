'use strict';

function clamp01(value){return Math.max(0,Math.min(1,Number(value)));}
function normalizeRating(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(99,n)):null;}
function average(values){const valid=values.map(normalizeRating).filter(v=>v!==null);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;}

function createCoreGameplayProfile(input={}){
  const possession=Object.freeze({
    skating:normalizeRating(input.skating),passing:normalizeRating(input.passing),puckControl:normalizeRating(input.puckControl),
    defensivePressure:normalizeRating(input.defensivePressure),faceoffs:normalizeRating(input.faceoffs),
    coaching:normalizeRating(input.coaching),matchup:normalizeRating(input.matchup),fatigue:normalizeRating(input.fatigue)
  });
  const shooting=Object.freeze({
    skill:normalizeRating(input.shootingSkill),accuracy:normalizeRating(input.accuracy),power:normalizeRating(input.shotPower),
    positionQuality:normalizeRating(input.positionQuality),passingSupport:normalizeRating(input.passingSupport),
    pressure:normalizeRating(input.pressure),confidence:normalizeRating(input.confidence),goalieQuality:normalizeRating(input.goalieQuality)
  });
  const goaltending=Object.freeze({
    reflexes:normalizeRating(input.reflexes),positioning:normalizeRating(input.goaliePositioning),
    reboundControl:normalizeRating(input.reboundControl),consistency:normalizeRating(input.goalieConsistency),
    fatigue:normalizeRating(input.goalieFatigue),confidence:normalizeRating(input.goalieConfidence),
    defensiveSupport:normalizeRating(input.defensiveSupport),shotQuality:normalizeRating(input.shotQuality)
  });
  return Object.freeze({
    kind:'core-gameplay-profile',version:1,
    possession,shooting,goaltending,
    chanceTypes:Object.freeze(['low-danger','medium-danger','high-danger','rush','breakaway','rebound','one-timer','screen','deflection']),
    derived:Object.freeze({
      possessionReadiness:average([possession.skating,possession.passing,possession.puckControl,possession.defensivePressure,possession.faceoffs,possession.coaching,possession.matchup]),
      shootingReadiness:average([shooting.skill,shooting.accuracy,shooting.power,shooting.positionQuality,shooting.passingSupport,shooting.confidence]),
      goaltendingReadiness:average([goaltending.reflexes,goaltending.positioning,goaltending.reboundControl,goaltending.consistency,goaltending.confidence,goaltending.defensiveSupport])
    }),
    probabilitiesApplied:false,eventsGenerated:false
  });
}

function resolveDeterministicUnit(seed,key){
  const text=String(seed??'')+'|'+String(key??'');let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return clamp01((h>>>0)/4294967295);
}

function createGameplayEventBoundary(profile,{seed=null,eventKey=null}={}){
  if(!profile||profile.kind!=='core-gameplay-profile')throw new Error('Valid core gameplay profile required.');
  return Object.freeze({kind:'gameplay-event-boundary',version:1,seed,eventKey,
    deterministicUnit:seed===null?null:resolveDeterministicUnit(seed,eventKey),
    possessionWinner:null,zoneEntry:null,scoringChance:null,shot:null,save:null,goal:null,
    eventGenerated:false});
}

module.exports={createCoreGameplayProfile,resolveDeterministicUnit,createGameplayEventBoundary};
