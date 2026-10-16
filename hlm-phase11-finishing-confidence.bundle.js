/* Experimental finishing confidence browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-regression-trends')return global.HLMPhase11RegressionTrends;throw Error('Unsupported module')};
'use strict';
/* Experimental descriptive shot-volume confidence, never a calibrated forecast. */
const {summarizeRegressionTrends}=require('./hlm-phase11-regression-trends');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function confidence(record){
 const shots=record.shots,goals=record.goals,xg=record.expectedGoals;
 const sampleSizeTier=shots<10?'very-small':shots<30?'small':shots<75?'moderate':'larger';
 const observedShootingPercentage=shots?round(goals/shots):null;
 const expectedShootingPercentage=shots?round(xg/shots):null;
 const finishingGap=shots?round((goals-xg)/shots):null;
 // Wilson interval for observed binary outcomes only; xG is a model estimate.
 const z=1.96;
 const denominator=shots?1+z*z/shots:0;
 const center=shots?(goals/shots+z*z/(2*shots))/denominator:null;
 const half=shots?z*Math.sqrt((goals/shots)*(1-goals/shots)/shots+z*z/(4*shots*shots))/denominator:null;
 const observedInterval95=shots?[round(Math.max(0,center-half)),round(Math.min(1,center+half))]:null;
 const confidenceIndicator=shots===0?'no-shots':shots<30?'limited-sample':shots<75?'developing-sample':'larger-sample';
 const expectedWithinObservedInterval=shots?expectedShootingPercentage>=observedInterval95[0]-0.000001&&expectedShootingPercentage<=observedInterval95[1]+0.000001:null;
 return {shots,goals,expectedGoals:xg,sampleSizeTier,observedShootingPercentage,expectedShootingPercentage,
  finishingGap,observedInterval95,expectedWithinObservedInterval,confidenceIndicator,
  descriptiveOnly:true,notCalibratedProbability:true};
}
function summarizeFinishingConfidence(homeLineup,awayLineup,options={}){
 const base=summarizeRegressionTrends(homeLineup,awayLineup,options);
 const decorate=p=>({...p,finishingConfidence:confidence(p),earlyConfidence:confidence(p.comparison.early),lateConfidence:confidence(p.comparison.late)});
 const players=base.players.map(decorate);
 const teams={home:decorate(base.teams.home),away:decorate(base.teams.away)};
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team),t=teams[team];
  for(const part of ['finishingConfidence','earlyConfidence','lateConfidence']){
   const a=members.map(p=>p[part]),b=t[part];
   if(sum(a,'shots')!==b.shots||sum(a,'goals')!==b.goals||
    Math.abs(sum(a,'expectedGoals')-b.expectedGoals)>members.length*0.000001+0.000001)throw Error('Finishing confidence team conservation mismatch');
  }
  for(const p of members){
   if(p.earlyConfidence.shots+p.lateConfidence.shots!==p.finishingConfidence.shots||
      p.earlyConfidence.goals+p.lateConfidence.goals!==p.finishingConfidence.goals||
      Math.abs(p.earlyConfidence.expectedGoals+p.lateConfidence.expectedGoals-p.finishingConfidence.expectedGoals)>0.000003)throw Error('Finishing confidence player conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,games:base.games,teams,players,summaryModel:'experimental-finishing-confidence-v1',
  interpretation:'descriptive-shot-volume-and-observed-Wilson-interval-not-xG-calibration-or-future-prediction'};
}
module.exports={summarizeFinishingConfidence,confidence};

global.HLMPhase11FinishingConfidence=module.exports;
})(typeof window!=='undefined'?window:globalThis);
