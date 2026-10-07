'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
function bridgeError(code,message){const e=new Error(message);e.code=code;return e;}
function createGameSimulationActivation(input={}){
 const candidate=input.candidate,verification=input.verification;
 if(!candidate||candidate.kind!=='daily-game-simulation-candidate'||candidate.version!==1||candidate.persistencePerformed!==false)throw bridgeError('INVALID_GAME_SIMULATION_CANDIDATE','Valid daily game simulation candidate required.');
 if(!verification||verification.kind!=='daily-game-simulation-verification'||verification.version!==1||verification.valid!==true||verification.persistencePerformed!==false)throw bridgeError('INVALID_GAME_SIMULATION_VERIFICATION','Valid daily game simulation verification required.');
 if(!validateGameStateEnvelope(candidate.state).valid)throw bridgeError('INVALID_GAME_SIMULATION_STATE','Candidate GameState invalid.');
 return Object.freeze({kind:'game-simulation-activation',version:1,activated:true,date:candidate.date,gamesProcessed:candidate.gamesProcessed,gameSimulationPerformed:candidate.gameSimulationPerformed,
  candidate,verification,state:candidate.state,persistencePerformed:false});
}
function createGamePersistenceBridge(input={}){
 const activation=input.activation;
 if(!activation||activation.kind!=='game-simulation-activation'||activation.version!==1||activation.activated!==true||activation.persistencePerformed!==false||!validateGameStateEnvelope(activation.state).valid)throw bridgeError('INVALID_GAME_SIMULATION_ACTIVATION','Verified game simulation activation required.');
 return Object.freeze({kind:'game-persistence-bridge',version:1,ready:true,state:activation.state,date:activation.date,gamesProcessed:activation.gamesProcessed,
  requirements:Object.freeze({useExistingPersistencePipeline:true,explicitAuthorizationRequired:true,verifyAfterWriteRequired:true,rollbackOnFailureRequired:true}),persistencePerformed:false});
}
module.exports={createGameSimulationActivation,createGamePersistenceBridge};
