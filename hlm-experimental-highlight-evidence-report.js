'use strict';
/** Read-only evidence report combining the recap and its verification audit. */
const {createExperimentalHighlightRecap}=require('./hlm-experimental-highlight-recap');
const {createExperimentalHighlightRecapAudit}=require('./hlm-experimental-highlight-recap-audit');
function createExperimentalHighlightEvidenceReport(state,homeId,awayId,seed,playoff=false){
 const recap=createExperimentalHighlightRecap(state,homeId,awayId,seed,playoff);
 const audit=createExperimentalHighlightRecapAudit(state,homeId,awayId,seed,playoff);
 if(recap.researchReady!==audit.researchReady)throw new Error('EXPERIMENTAL_EVIDENCE_READINESS_MISMATCH');
 if(!recap.researchReady)return {kind:'experimental-highlight-evidence-report',researchReady:false,blockers:[...new Set([...(recap.blockers||[]),...(audit.blockers||[])])],report:null,official:false,persistencePerformed:false};
 if(!audit.audit.consistent||recap.recap.highlightCount!==audit.audit.highlightsChecked||recap.recap.periodsWithHighlights!==audit.audit.periodsChecked)throw new Error('EXPERIMENTAL_EVIDENCE_AUDIT_MISMATCH');
 const periods=recap.recap.periods.map(p=>({period:p.period,highlights:p.highlights,types:{...p.types},score:{...p.score},shots:{...p.shots}}));
 const report={verified:true,periods,highlightsChecked:audit.audit.highlightsChecked,periodsChecked:audit.audit.periodsChecked,typeCounts:{...audit.audit.typeCounts},latestHighlightedScore:recap.recap.latestHighlightedScore?{...recap.recap.latestHighlightedScore}:null,latestHighlightedShots:recap.recap.latestHighlightedShots?{...recap.recap.latestHighlightedShots}:null,leaderAtLastHighlight:audit.audit.lastHighlightedLeader,scope:'synthetic-highlights-only'};
 return {kind:'experimental-highlight-evidence-report',researchReady:true,report,official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightEvidenceReport};
