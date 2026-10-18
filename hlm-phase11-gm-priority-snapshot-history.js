/* Mission 1288: ephemeral aggregate workload snapshots. No production access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPrioritySnapshotHistory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function create(priority){
 if(!priority||typeof priority.snapshot!=='function')throw Error('Priority queue required');
 const records=[];let index=0;
 function capture(){const s=priority.snapshot();return Object.freeze({totalUnresolved:s.totalUnresolved,missingEvidenceItems:s.missingEvidenceItems,priorityCounts:Object.freeze({...s.priorityCounts})})}
 function explain(before,after){if(!before)return Object.freeze(['Initial aggregate workload snapshot']);const messages=[];for(const key of ['critical','high','medium','low']){const delta=after.priorityCounts[key]-before.priorityCounts[key];if(delta)messages.push(key+' workload '+(delta>0?'increased':'decreased')+' by '+Math.abs(delta))}for(const key of ['totalUnresolved','missingEvidenceItems']){const delta=after[key]-before[key];if(delta)messages.push(key+' '+(delta>0?'increased':'decreased')+' by '+Math.abs(delta))}return Object.freeze(messages.length?messages:['No aggregate workload change'])}
 function record(){const current=capture(),previous=records.length?records[records.length-1].aggregate:null;records.push(Object.freeze({aggregate:current,explanations:explain(previous,current)}));index=records.length-1;return snapshot()}
 function snapshot(){return Object.freeze({index,count:records.length,explanations:records[index].explanations,aggregate:records[index].aggregate,verified:0,approved:0,productionActivationAllowed:false})}
 function serialize(){return JSON.stringify({kind:'experimental-gm-aggregate-priority-history',snapshots:records.map(x=>({aggregate:x.aggregate,explanations:x.explanations})),verified:0,approved:0,independentVerification:'pending',productionActivationAllowed:false,containsNoteContents:false})}
 record();return Object.freeze({record,snapshot,previous(){index=Math.max(0,index-1);return snapshot()},next(){index=Math.min(records.length-1,index+1);return snapshot()},serialize,productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});