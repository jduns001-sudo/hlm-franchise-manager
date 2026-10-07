'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const ASSIGNMENT_TYPES=Object.freeze(['standard','emergency','conditioning']);
const OPERATION_TYPES=Object.freeze(['waiver-placement','waiver-claim','call-up','demotion','release','buyout']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createRosterOperationCandidate(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_ROSTER_OPERATION_GAME_STATE','Valid GameState required.');
 const type=String(input.type||'');if(!OPERATION_TYPES.includes(type))fail('UNSUPPORTED_ROSTER_OPERATION','Supported roster operation required.');
 const playerId=String(input.playerId??'').trim();if(!playerId)fail('ROSTER_OPERATION_PLAYER_REQUIRED','Permanent player ID required.');
 const player=state.universe.players.find(p=>String(p.id)===playerId);if(!player)fail('ROSTER_OPERATION_PLAYER_NOT_FOUND','Player not found.');
 const teamId=String(input.teamId??'').trim();if(!teamId)fail('ROSTER_OPERATION_TEAM_REQUIRED','Permanent team ID required.');
 if(!state.universe.teams.some(t=>String(t.id)===teamId))fail('ROSTER_OPERATION_TEAM_NOT_FOUND','Team not found.');
 const assignmentType=input.assignmentType??null;
 const assignmentValid=!['call-up','demotion'].includes(type)||ASSIGNMENT_TYPES.includes(assignmentType);
 const rulesSupplied=input.leagueRules!=null;
 const waiverData=Object.freeze({eligibility:input.waiverEligibility??null,priority:input.waiverPriority??null,claims:Object.freeze([...(input.claims||[])]),history:Object.freeze([...(input.waiverHistory||[])])});
 const financialConsequences=Object.freeze({...((input.financialConsequences)||{})});
 const requiresFinancialConsequences=['release','buyout'].includes(type);
 const blockers=[];
 if(!assignmentValid)blockers.push('ASSIGNMENT_TYPE_REQUIRED');
 if(!rulesSupplied)blockers.push('LEAGUE_RULES_REQUIRED');
 if(requiresFinancialConsequences&&Object.keys(financialConsequences).length===0)blockers.push('FINANCIAL_CONSEQUENCES_REQUIRED');
 return Object.freeze({kind:'roster-operation-candidate',version:1,type,playerId,teamId,assignmentType,assignmentValid,
  waiverData,leagueRules:input.leagueRules??null,financialConsequences,requiresFinancialConsequences,
  readiness:Object.freeze({ready:blockers.length===0,blockers:Object.freeze(blockers)}),
  candidateOnly:true,transactionPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={ASSIGNMENT_TYPES,OPERATION_TYPES,createRosterOperationCandidate};
