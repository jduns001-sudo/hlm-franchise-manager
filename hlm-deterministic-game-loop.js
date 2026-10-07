'use strict';
const {createGameSimulationInput}=require('./hlm-game-simulation-foundation');
const {createGameStrengthSnapshot}=require('./hlm-game-strength-inputs');
const {resolveDeterministicUnit}=require('./hlm-core-gameplay-systems');
const {createCoreGameplaySequence}=require('./hlm-core-gameplay-events');

function loopError(code,message){const e=new Error(message);e.code=code;return e;}
function executeDeterministicGameLoop(state,gameId,options={}){
 const seed=options.deterministicSeed;
 if(seed===undefined||seed===null||seed==='')throw loopError('GAME_SIMULATION_SEED_REQUIRED','Deterministic seed is required.');
 const input=createGameSimulationInput(state,gameId,{mode:options.mode,deterministicSeed:seed});
 const strengths=createGameStrengthSnapshot(input,state,options);
 const eventCount=Number.isInteger(options.eventCount)&&options.eventCount>0?options.eventCount:1;
 const resolver=typeof options.resolveEvent==='function'?options.resolveEvent:null;
 const sequences=[];
 for(let index=0;index<eventCount;index++){
  const unit=resolveDeterministicUnit(seed,input.gameId+':'+index);
  const attackingTeamId=unit<0.5?input.matchup.homeTeamId:input.matchup.awayTeamId;
  const defendingTeamId=String(attackingTeamId)===String(input.matchup.homeTeamId)?input.matchup.awayTeamId:input.matchup.homeTeamId;
  const resolution=resolver?resolver(Object.freeze({index,unit,attackingTeamId,defendingTeamId,input,strengths})):null;
  const sequence=createCoreGameplaySequence({gameId:input.gameId,teamId:attackingTeamId,goalieId:resolution?.goalieId??null,playerId:resolution?.playerId??null,
   danger:resolution?.danger??'medium',outcome:resolution?.outcome??null,period:resolution?.period??null,clock:resolution?.clock??null,
   rush:resolution?.rush===true,breakaway:resolution?.breakaway===true,rebound:resolution?.rebound===true,oneTimer:resolution?.oneTimer===true,
   screen:resolution?.screen===true,deflection:resolution?.deflection===true,strengthState:resolution?.strengthState??'5v5',scoreState:resolution?.scoreState??'tied'});
  sequences.push(Object.freeze({index,unit,attackingTeamId,defendingTeamId,sequence}));
 }
 return Object.freeze({kind:'deterministic-game-loop-candidate',version:1,gameId:input.gameId,mode:input.mode,seed,
  input,strengths,sequences:Object.freeze(sequences),eventCount,simulationPerformed:true,resolutionStrategyApplied:resolver!==null,
  scoreFinalized:false,statisticsFinalized:false,persistencePerformed:false});
}
module.exports={executeDeterministicGameLoop};
