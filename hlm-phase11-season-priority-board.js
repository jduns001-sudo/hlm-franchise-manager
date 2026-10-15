'use strict';
/* Read-only human-GM decision priorities. No actions or production save writes. */
const {buildPerformanceAdvisory}=require('./hlm-phase11-performance-advisory');
function buildPriorityBoard(state){
 const report=buildPerformanceAdvisory(state);
 const priorities=report.recommendations.map((item,index)=>({id:'performance-'+(index+1),category:'season-performance',action:item.type,reason:item.reason,priority:item.priority,requiresGMApproval:true,status:'suggested',automaticallyApplied:false}));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,controlledTeamId:report.controlledTeamId,priorities};
}
module.exports={buildPriorityBoard};
