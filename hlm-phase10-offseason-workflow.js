'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {expireOffseasonContracts}=require('./hlm-phase10-offseason-contracts');
const {listOffseasonFreeAgents}=require('./hlm-phase10-free-agency');
const {signOffseasonFreeAgent}=require('./hlm-phase10-free-agent-signing');
/** Apply explicit offseason operations atomically to a cloned franchise save. */
function runOffseasonContractWindow(state,{expiredContractIds=[],signings=[]}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(expiredContractIds)||!Array.isArray(signings))throw new TypeError('Offseason operations must be arrays');
  let current=expireOffseasonContracts(state,expiredContractIds).nextState;
  const freeAgentsBefore=listOffseasonFreeAgents(current).count;
  const executed=[];
  for(const signing of signings){
    const result=signOffseasonFreeAgent(current,signing);
    current=result.nextState;
    executed.push(result.summary);
  }
  return {nextState:current,summary:{expiredCount:expiredContractIds.length,freeAgentsBefore,signings:executed,freeAgentsAfter:listOffseasonFreeAgents(current).count}};
}
module.exports={runOffseasonContractWindow};
