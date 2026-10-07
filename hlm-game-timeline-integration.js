'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const {buildGameResultCandidate,verifyGameResultCandidate}=require('./hlm-game-result-transaction');
function clone(v){return JSON.parse(JSON.stringify(v));}
function error(code,message){const e=new Error(message);e.code=code;return e;}
function createDailyGameSimulationCandidate(state,date,options={}){
 if(!validateGameStateEnvelope(state).valid)throw error('INVALID_DAILY_GAME_STATE','Valid GameState required.');
 const gameOptions=options.games||{};let candidate=clone(state);const processed=[];
 const due=state.activity.games.filter(g=>g.status==='Scheduled'&&g.date===date);
 for(const game of due){
  const specific=gameOptions[String(game.id)]||{};const seed=specific.deterministicSeed??(options.seedFactory?options.seedFactory(game):null);
  if(seed===null||seed===undefined||seed==='')throw error('DAILY_GAME_SEED_REQUIRED','Every due game requires a deterministic seed.');
  const loop=executeDeterministicGameLoop(candidate,game.id,{...specific,deterministicSeed:seed});
  const transaction=buildGameResultCandidate(candidate,loop);const verification=verifyGameResultCandidate(candidate,transaction);
  if(!verification.valid)throw error('DAILY_GAME_RESULT_INVALID','Game result candidate failed verification.');
  candidate=clone(transaction.candidateState);processed.push(Object.freeze({gameId:game.id,loop,transaction,verification}));
 }
 return Object.freeze({kind:'daily-game-simulation-candidate',version:1,date,processed:Object.freeze(processed),gamesProcessed:processed.length,
  state:candidate,sourceStateMutated:false,gameSimulationPerformed:processed.length>0,persistencePerformed:false});
}
function verifyDailyGameSimulationCandidate(source,candidate){
 const errors=[];if(!candidate||candidate.kind!=='daily-game-simulation-candidate')errors.push('INVALID_CANDIDATE');
 if(candidate&&!validateGameStateEnvelope(candidate.state).valid)errors.push('INVALID_CANDIDATE_STATE');
 if(candidate&&candidate.processed.some(x=>x.verification.valid!==true))errors.push('UNVERIFIED_GAME_RESULT');
 if(candidate&&candidate.processed.some(x=>candidate.state.activity.games.find(g=>String(g.id)===String(x.gameId))?.status!=='Played'))errors.push('GAME_NOT_PLAYED');
 if(candidate&&candidate.persistencePerformed!==false)errors.push('UNEXPECTED_PERSISTENCE');
 return Object.freeze({kind:'daily-game-simulation-verification',version:1,valid:errors.length===0,errors:Object.freeze(errors),sourceStateUnchanged:validateGameStateEnvelope(source).valid,persistencePerformed:false});
}
module.exports={createDailyGameSimulationCandidate,verifyDailyGameSimulationCandidate};
