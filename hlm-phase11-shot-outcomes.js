'use strict';
/* Isolated deterministic goal/save outcomes; never writes official results or saves. */
const {estimateShotQuality}=require('./hlm-phase11-shot-quality');
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function simulateShotOutcomes(lineup,{goalie=null,periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Seed must be a nonnegative safe integer');
 const quality=estimateShotQuality(lineup,{periodSeconds,shiftSeconds,seed});
 const rating=goalie==null?80:Number(goalie.ovr);
 const goalieRating=Number.isFinite(rating)?clamp(rating,0,120):80;
 // Relative save skill scales shot conversion without changing the upstream xG model.
 const goalieFactor=clamp(1+(80-goalieRating)/200,0.65,1.35);
 let state=((seed%4294967296)>>>0)^0x9e3779b9;
 const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
 let goals=0,saves=0,expectedGoalsAgainst=0;
 const events=quality.events.map(event=>{
  const goalProbability=Number(clamp(event.expectedGoalProbability*goalieFactor,0.005,0.3).toFixed(6));
  const outcome=random()<goalProbability?'goal':'save';
  if(outcome==='goal')goals++;else saves++;
  expectedGoalsAgainst+=goalProbability;
  return {...event,goalProbability,saveProbability:Number((1-goalProbability).toFixed(6)),outcome,goalieId:goalie?.id==null?null:String(goalie.id)};
 });
 return {...quality,events,goals,saves,shotsOnGoal:events.length,expectedGoalsAgainst:Number(expectedGoalsAgainst.toFixed(6)),
  goalieRating,outcomeModel:'experimental-goalie-rating-v1',experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true};
}
module.exports={simulateShotOutcomes};
