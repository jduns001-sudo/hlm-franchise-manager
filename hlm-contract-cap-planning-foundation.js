'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function numberOrNull(v){return Number.isFinite(Number(v))?Number(v):null;}
function createContractCapPlanningSnapshot(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_CONTRACT_CAP_GAME_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id)fail('CONTRACT_CAP_TEAM_REQUIRED','Permanent team ID required.');
 if(!state.universe.teams.some(t=>String(t.id)===id))fail('CONTRACT_CAP_TEAM_NOT_FOUND','Team not found.');
 const contracts=Object.freeze(state.assets.contracts.filter(c=>String(c.teamId)===id).map(c=>Object.freeze({...c})));
 const seasonId=options.seasonId??null;
 const financeRows=Array.isArray(state.finances)?state.finances:Object.values(state.finances||{});
 const finance=financeRows.find(f=>String(f.teamId)===id&&(seasonId===null||String(f.seasonId)===String(seasonId)))||null;
 const capLimit=finance?numberOrNull(finance.capLimit):null;
 const payroll=finance?numberOrNull(finance.payroll):null;
 const availableSpace=capLimit!==null&&payroll!==null?capLimit-payroll:null;
 const futureCommitments=Object.freeze((options.futureCommitments||[]).map(x=>Object.freeze({...x})));
 const deadMoney=Object.freeze((options.deadMoney||[]).map(x=>Object.freeze({...x})));
 const expiringContracts=Object.freeze((options.expiringContracts||[]).map(x=>Object.freeze({...x})));
 const projectedRaises=Object.freeze((options.projectedRaises||[]).map(x=>Object.freeze({...x})));
 const rosterNeeds=Object.freeze((options.rosterNeeds||[]).map(x=>Object.freeze({...x})));
 const prospects=Object.freeze((options.prospects||[]).map(x=>Object.freeze({...x})));
 return Object.freeze({kind:'contract-cap-planning-snapshot',version:1,teamId:id,seasonId,contracts,
  contractModel:Object.freeze({canonicalRequired:Object.freeze(['playerId','teamId','aav','years','season','status']),
   specificationExtensions:Object.freeze(['bonuses','options','clauses','negotiation'])}),
  cap:Object.freeze({capLimit,payroll,availableSpace,deadMoney,leagueMechanisms:options.leagueMechanisms??null,calculationPerformed:availableSpace!==null}),
  futurePlanning:Object.freeze({futureCommitments,expiringContracts,projectedRaises,rosterNeeds,prospects,projectedSpace:options.projectedSpace??null}),
  rules:Object.freeze({leagueSpecificRulesSupplied:options.leagueMechanisms!=null,hardCodedLeagueRules:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={createContractCapPlanningSnapshot};
