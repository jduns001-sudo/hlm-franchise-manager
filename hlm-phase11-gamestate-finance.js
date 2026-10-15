'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {computeSeason,evaluateDecision,cpuRecommendation,dashboard}=require('./hlm-phase11-finance-integration');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
function safe(n,label){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid '+label);return n}
function teamKey(x){return String(x)}
function derive(state,teamId,policy){
 const validation=validateGameStateEnvelope(state);if(!validation.valid)throw Error('Invalid GameState envelope');
 const team=state.universe.teams.find(t=>teamKey(t.id)===teamKey(teamId));if(!team)throw Error('Unknown team');
 if(!policy||typeof policy!=='object')throw Error('Explicit financial policy required');
 const games=state.activity.games.filter(g=>teamKey(g.homeTeamId)===teamKey(teamId));
 const played=games.filter(g=>g.status==='final'||g.status==='completed').length;
 const remaining=games.filter(g=>g.status==='scheduled').length;
 const contracts=state.assets.contracts.filter(c=>teamKey(c.teamId)===teamKey(teamId)&&c.status!=='expired');
 const payroll=contracts.reduce((total,c)=>{const salary=safe(c.annualSalary,'contract annualSalary');const n=total+salary;if(!Number.isSafeInteger(n))throw Error('Payroll overflow');return n},0);
 const input={...policy,payroll};
 const calendar={homeGamesPlayed:played,remainingHomeGames:remaining};
 const result=computeSeason(input,calendar);
 return Object.freeze({teamId:team.id,teamName:team.name,contractCount:contracts.length,calendar,financials:result,cpu:cpuRecommendation(input),dashboard:dashboard(input,calendar),policy:input});
}
function previewDay(state,seed,teamId,policy){
 const simulation=simulateNextDay(state,seed);
 const before=derive(state,teamId,policy),after=derive(simulation.nextState,teamId,policy);
 return Object.freeze({fromDate:simulation.fromDate,toDate:simulation.toDate,gameResults:simulation.results.length,before,after,nextState:simulation.nextState});
}
function previewSigning(state,teamId,policy,salary){const projection=derive(state,teamId,policy);return evaluateDecision(projection.policy,{type:'sign',annualSalary:salary})}
module.exports={derive,previewDay,previewSigning};
