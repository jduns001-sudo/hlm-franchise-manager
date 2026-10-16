'use strict';
/* Read-only deterministic GM evidence trend across explicitly supplied saved snapshots. */
const {buildGMEvidenceCoverage}=require('./hlm-phase11-gm-evidence-coverage');
function buildGMEvidenceTrend(savedSnapshots){
 if(!Array.isArray(savedSnapshots))throw new TypeError('savedSnapshots must be an array');
 const snapshots=savedSnapshots.map((entry,index)=>{
  const coverage=buildGMEvidenceCoverage(entry.state);
  return {index,saveId:String(entry.saveId??index),coveragePercent:coverage.coveragePercent,
   reviewReady:coverage.reviewReady,awaitingEvidence:coverage.awaitingEvidence,
   pendingDecisions:coverage.pendingDecisions};
 });
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,
  requiresGMApproval:true,automaticallyApplied:false,
  snapshots,coverageChange:snapshots.length>1?snapshots[snapshots.length-1].coveragePercent-snapshots[0].coveragePercent:0};
}
module.exports={buildGMEvidenceTrend};
