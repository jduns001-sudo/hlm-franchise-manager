'use strict';
// One read-only CPU decision review pass for every non-human team in a saved universe.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createCPUDecisionCycleReviewQueue}=require('./hlm-cpu-decision-cycle-review-queue');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createLeaguewideCPUDecisionReview(state,{decisionOptionsByTeam={}}={}){
 if(!validateGameStateEnvelope(state).valid)fail('CPU_LEAGUE_REVIEW_INVALID_STATE','Valid GameState required');
 const before=serializeGameState(state);
 const controlled=String(state.meta.controlledTeamId??'');
 const seen=new Set(),teams=[];
 for(const team of state.universe.teams){
  const id=String(team?.id??'').trim();
  if(!id||seen.has(id))fail('CPU_LEAGUE_REVIEW_DUPLICATE_TEAM','All teams need unique permanent IDs');
  seen.add(id);
  if(id!==controlled)teams.push(id);
 }
 if(!controlled||!seen.has(controlled))fail('CPU_LEAGUE_REVIEW_CONTROLLED_TEAM_REQUIRED','Valid controlled franchise required');
 if(!decisionOptionsByTeam||typeof decisionOptionsByTeam!=='object'||Array.isArray(decisionOptionsByTeam))
  fail('CPU_LEAGUE_REVIEW_OPTIONS_INVALID','Team decision options must be a map');
 const unknown=Object.keys(decisionOptionsByTeam).filter(id=>!seen.has(id)||id===controlled);
 if(unknown.length)fail('CPU_LEAGUE_REVIEW_TEAM_OPTIONS_INVALID','Options may only target existing CPU teams');
 const items=teams.map(teamId=>{
  const review=createCPUDecisionCycleReviewQueue(state,teamId,decisionOptionsByTeam[teamId]||{});
  return Object.freeze({teamId,review,status:review.items[0].status,nextStep:review.items[0].nextStep,
   humanReviewRequired:true,executionEnabled:false});
 });
 if(serializeGameState(state)!==before)fail('CPU_LEAGUE_REVIEW_SOURCE_MUTATED','CPU review mutated source franchise');
 return Object.freeze({kind:'phase9-leaguewide-cpu-decision-review',version:1,controlledTeamId:controlled,
  teamCount:teams.length,items:Object.freeze(items),sourceFingerprint:before,
  advisoryOnly:true,requiresHumanGMApproval:true,executionPerformed:false,persistencePerformed:false,
  sourceStateMutated:false});
}
module.exports={createLeaguewideCPUDecisionReview};
