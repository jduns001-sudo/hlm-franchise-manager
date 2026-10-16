'use strict';
/* Read-only alerts from explicitly supplied saved GM evidence snapshots. */
const {buildGMEvidenceTrend}=require('./hlm-phase11-gm-evidence-trend');
function buildGMEvidenceTrendAlerts(savedSnapshots){
 const trend=buildGMEvidenceTrend(savedSnapshots);
 const previous=trend.snapshots.length>1?trend.snapshots[trend.snapshots.length-2]:null;
 const current=trend.snapshots.length?trend.snapshots[trend.snapshots.length-1]:null;
 const delta=previous&&current?current.coveragePercent-previous.coveragePercent:0;
 const alerts=[];
 if(previous&&delta<0)alerts.push({type:'COVERAGE_DECLINE',severity:'review',change:delta,decision:'pending'});
 if(current&&current.awaitingEvidence>0)alerts.push({type:'EVIDENCE_GAPS',severity:'info',count:current.awaitingEvidence,decision:'pending'});
 return {official:false,advisoryOnly:true,productionActivationEnabled:false,requiresGMApproval:true,automaticallyApplied:false,
  coverageChangeSincePrevious:delta,alerts};
}
module.exports={buildGMEvidenceTrendAlerts};
