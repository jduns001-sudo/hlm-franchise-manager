'use strict';

const EVENT_TYPES=Object.freeze(['possession','zone-entry','scoring-chance','shot','save','goal']);
const DANGER_LEVELS=Object.freeze(['low','medium','high']);

function eventError(code,message){const e=new Error(message);e.code=code;return e;}
function finite(value){return typeof value==='number'&&Number.isFinite(value);}

function createGameEvent(input={}){
 if(!EVENT_TYPES.includes(input.type))throw eventError('INVALID_GAME_EVENT_TYPE','Unsupported game event type.');
 if(input.gameId===undefined||input.gameId===null)throw eventError('GAME_EVENT_GAME_REQUIRED','gameId is required.');
 if(input.teamId===undefined||input.teamId===null)throw eventError('GAME_EVENT_TEAM_REQUIRED','teamId is required.');
 if(!finite(input.sequence)||input.sequence<1)throw eventError('GAME_EVENT_SEQUENCE_REQUIRED','Positive numeric sequence is required.');
 const danger=input.danger??null;
 if(danger!==null&&!DANGER_LEVELS.includes(danger))throw eventError('INVALID_DANGER_LEVEL','Unsupported danger level.');
 return Object.freeze({
  kind:'game-event',version:1,gameId:input.gameId,sequence:input.sequence,type:input.type,
  teamId:input.teamId,playerId:input.playerId??null,goalieId:input.goalieId??null,
  period:input.period??null,clock:input.clock??null,danger,
  sourceEventSequence:input.sourceEventSequence??null,
  context:Object.freeze({
   rush:input.rush===true,breakaway:input.breakaway===true,rebound:input.rebound===true,
   oneTimer:input.oneTimer===true,screen:input.screen===true,deflection:input.deflection===true,
   strengthState:input.strengthState??null,scoreState:input.scoreState??null
  }),
  resolved:true,persistencePerformed:false
 });
}

function createCoreGameplaySequence(input={}){
 const events=[];let sequence=1;
 const push=(type,extra={})=>{const e=createGameEvent({...input,...extra,type,sequence});events.push(e);sequence+=1;return e;};
 const possession=push('possession');
 const entry=push('zone-entry',{sourceEventSequence:possession.sequence});
 const chance=push('scoring-chance',{sourceEventSequence:entry.sequence,danger:input.danger??'medium'});
 const shot=push('shot',{sourceEventSequence:chance.sequence,danger:chance.danger});
 let terminal=null;
 if(input.outcome==='save')terminal=push('save',{sourceEventSequence:shot.sequence,danger:shot.danger});
 else if(input.outcome==='goal')terminal=push('goal',{sourceEventSequence:shot.sequence,danger:shot.danger});
 return Object.freeze({
  kind:'core-gameplay-sequence',version:1,gameId:input.gameId,
  events:Object.freeze(events),terminalOutcome:terminal?terminal.type:null,
  possessionModeled:true,zoneEntryModeled:true,scoringChanceModeled:true,shootingModeled:true,
  goaltendingModeled:terminal?.type==='save',goalModeled:terminal?.type==='goal',
  probabilitiesApplied:false,simulationPerformed:false,persistencePerformed:false
 });
}

module.exports={EVENT_TYPES,DANGER_LEVELS,createGameEvent,createCoreGameplaySequence};
