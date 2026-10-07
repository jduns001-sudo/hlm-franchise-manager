'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createGameOutputPackage}=require('./hlm-game-outputs');
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function err(code,message){const e=new Error(message);e.code=code;return e;}
function buildGameResultCandidate(state,loop){
 if(!validateGameStateEnvelope(state).valid)throw err('INVALID_GAME_RESULT_STATE','Valid GameState required.');
 if(!loop||loop.kind!=='deterministic-game-loop-candidate'||loop.simulationPerformed!==true)throw err('INVALID_GAME_LOOP_RESULT','Completed deterministic game loop required.');
 const game=state.activity.games.find(g=>String(g.id)===String(loop.gameId));
 if(!game||game.status!=='Scheduled')throw err('GAME_NOT_SCHEDULED','Scheduled game required.');
 const homeId=loop.input.matchup.homeTeamId,awayId=loop.input.matchup.awayTeamId;
 let homeGoals=0,awayGoals=0;const playByPlay=[];let sequence=1;
 for(const item of loop.sequences){for(const event of item.sequence.events){
  playByPlay.push({...event,sequence:sequence++});
  if(event.type==='goal'){if(String(event.teamId)===String(homeId))homeGoals++;else if(String(event.teamId)===String(awayId))awayGoals++;}
 }}
 const gameRecord={gameId:loop.gameId,homeTeamId:homeId,awayTeamId:awayId,homeGoals,awayGoals,status:'Played'};
 const output=createGameOutputPackage({gameId:loop.gameId,standardStatistics:{homeGoals,awayGoals},advancedStatistics:{},playByPlay,history:{gameRecord,leagueHistory:[{type:'game-played',gameId:loop.gameId}]}});
 const candidate=clone(state);const index=candidate.activity.games.findIndex(g=>String(g.id)===String(loop.gameId));
 candidate.activity.games[index]={...candidate.activity.games[index],homeScore:homeGoals,awayScore:awayGoals,status:'Played',result:{homeGoals,awayGoals}};
 candidate.history.statistics.push({kind:'game-statistics',gameId:loop.gameId,homeGoals,awayGoals});
 candidate.history.records.push(clone(gameRecord));
 return Object.freeze({kind:'game-result-transaction-candidate',version:1,gameId:loop.gameId,score:Object.freeze({homeGoals,awayGoals}),output,candidateState:candidate,sourceStateMutated:false,verified:false,persistencePerformed:false});
}
function verifyGameResultCandidate(state,tx){
 if(!tx||tx.kind!=='game-result-transaction-candidate')return Object.freeze({valid:false,errors:Object.freeze(['INVALID_TRANSACTION'])});
 const errors=[];const game=tx.candidateState&&tx.candidateState.activity&&tx.candidateState.activity.games.find(g=>String(g.id)===String(tx.gameId));
 if(!game||game.status!=='Played')errors.push('GAME_NOT_MARKED_PLAYED');
 if(game&&(game.homeScore!==tx.score.homeGoals||game.awayScore!==tx.score.awayGoals))errors.push('SCORE_MISMATCH');
 if(JSON.stringify(state)===JSON.stringify(tx.candidateState))errors.push('NO_STATE_CHANGE');
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),persistencePerformed:false});
}
module.exports={buildGameResultCandidate,verifyGameResultCandidate};
