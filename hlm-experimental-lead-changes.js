'use strict';
/** Research-only lead changes and comeback labels over synthetic period scores. */
const {createExperimentalGameTrends}=require('./hlm-experimental-game-trends');
function createExperimentalLeadChanges(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalGameTrends(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-lead-changes',researchReady:false,blockers:base.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 let previousLeader='tied',lastNonTiedLeader=null,leadChanges=0,tieTransitions=0;
 let homeTrailed=false,awayTrailed=false;
 const periods=base.periods.map(p=>{
  const leader=p.goalMargin>0?'home':p.goalMargin<0?'away':'tied';
  if(leader==='away')homeTrailed=true;
  if(leader==='home')awayTrailed=true;
  if(leader==='tied'&&previousLeader!=='tied')tieTransitions++;
  if(leader!=='tied'){
   if(lastNonTiedLeader!==null&&lastNonTiedLeader!==leader)leadChanges++;
   lastNonTiedLeader=leader;
  }
  const row={...p,leader,leadChanged:leader!=='tied'&&previousLeader!=='tied'&&leader!==previousLeader,tiedAfterPeriod:leader==='tied',cumulativeLeadChanges:leadChanges};
  previousLeader=leader;
  return row;
 });
 const finalLeader=periods.at(-1).leader;
 const teams={home:{...base.teams.home,trailedAtPeriodEnd:homeTrailed,comebackWin:homeTrailed&&finalLeader==='home'},away:{...base.teams.away,trailedAtPeriodEnd:awayTrailed,comebackWin:awayTrailed&&finalLeader==='away'}};
 const valid=base.audit.consistent&&periods.at(-1).goalMargin===teams.home.goalDifferential&&periods.every((p,i)=>p.cumulativeLeadChanges>=0&&(i===0||p.cumulativeLeadChanges>=periods[i-1].cumulativeLeadChanges))&&!(teams.home.comebackWin&&teams.away.comebackWin);
 if(!valid)throw new Error('EXPERIMENTAL_LEAD_CHANGES_AUDIT_FAILED');
 return {kind:'experimental-lead-changes',researchReady:true,periods,teams,summary:{leadChanges,tieTransitions,finalLeader},audit:{consistent:true,periodsChecked:periods.length},leadMode:'period-boundary-synthetic',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalLeadChanges};
