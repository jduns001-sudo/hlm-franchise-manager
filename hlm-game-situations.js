'use strict';

const STRENGTH_STATES=Object.freeze(['5v5','5v4','4v5','5v3','3v5','4v4','3v3','6v5','5v6']);
const GAME_SITUATIONS=Object.freeze(['tied','leading','trailing','late-game','empty-net','overtime']);

function normalize(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(99,n)):null;}
function createSpecialTeamsProfile(input={}){
 return Object.freeze({
  kind:'special-teams-profile',version:1,
  powerPlay:Object.freeze({personnel:Object.freeze([...(input.powerPlayPersonnel||[])]),tactics:input.powerPlayTactics??null,rating:normalize(input.powerPlayRating)}),
  penaltyKill:Object.freeze({personnel:Object.freeze([...(input.penaltyKillPersonnel||[])]),tactics:input.penaltyKillTactics??null,rating:normalize(input.penaltyKillRating)})
 });
}
function createPenaltyProfile(input={}){
 return Object.freeze({kind:'penalty-profile',version:1,discipline:normalize(input.discipline),aggression:normalize(input.aggression),
  physicality:normalize(input.physicality),defensivePressure:normalize(input.defensivePressure),personality:input.personality??null,
  gameSituation:input.gameSituation??null,officiatingTendency:normalize(input.officiatingTendency),probabilityApplied:false});
}
function createGameSituation(input={}){
 const home=Number(input.homeScore??0),away=Number(input.awayScore??0),period=Number(input.period??1),secondsRemaining=input.secondsRemaining??null;
 const scoreState=home===away?'tied':home>away?'home-leading':'away-leading';
 const lateGame=period>=3&&secondsRemaining!==null&&Number(secondsRemaining)<=300;
 const overtime=period>3||input.overtime===true;
 return Object.freeze({kind:'game-situation',version:1,homeScore:home,awayScore:away,period,secondsRemaining,
  scoreState,lateGame,overtime,homeGoaliePulled:input.homeGoaliePulled===true,awayGoaliePulled:input.awayGoaliePulled===true,
  shortenedBench:input.shortenedBench===true});
}
function createMomentumState(events=[]){
 const qualifying=events.filter(e=>e&&['save','goal'].includes(e.type));
 return Object.freeze({kind:'event-driven-momentum',version:1,sourceEventSequences:Object.freeze(qualifying.map(e=>e.sequence)),
  sourceEventTypes:Object.freeze(qualifying.map(e=>e.type)),value:null,derivedFromRealEventsOnly:true,arbitraryMeter:false});
}
module.exports={STRENGTH_STATES,GAME_SITUATIONS,createSpecialTeamsProfile,createPenaltyProfile,createGameSituation,createMomentumState};
