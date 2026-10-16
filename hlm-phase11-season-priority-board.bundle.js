/* Experimental human GM priority board browser projection. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-performance-advisory')return global.HLMPhase11PerformanceAdvisory;throw Error('Unsupported module')};
'use strict';
/* Read-only human-GM decision priorities. No actions or production save writes. */
const {buildPerformanceAdvisory}=require('./hlm-phase11-performance-advisory');
function buildPriorityBoard(state){
 const report=buildPerformanceAdvisory(state);
 const priorities=report.recommendations.map((item,index)=>({id:'performance-'+(index+1),category:'season-performance',action:item.type,reason:item.reason,priority:item.priority,requiresGMApproval:true,status:'suggested',automaticallyApplied:false}));
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,controlledTeamId:report.controlledTeamId,priorities};
}
module.exports={buildPriorityBoard};

global.HLMPhase11SeasonPriorityBoard=module.exports;
})(typeof window!=='undefined'?window:globalThis);
