'use strict';
/* Experimental GM priority provenance. Read-only and never auto-approves. */
const {buildPriorityBoard}=require('./hlm-phase11-season-priority-board');
const {projectLeagueTrends}=require('./hlm-phase11-league-trends');
function buildPriorityHistory(state){
 const board=buildPriorityBoard(state),league=projectLeagueTrends(state);
 const history=board.priorities.map(priority=>({...priority,source:'season-performance',supportingFinalGames:league.franchiseHistory.map(game=>String(game.id)),humanGMDecision:'pending',automaticallyApplied:false}));
 return {official:false,productionActivationEnabled:false,advisoryOnly:true,controlledTeamId:board.controlledTeamId,history};
}
module.exports={buildPriorityHistory};
