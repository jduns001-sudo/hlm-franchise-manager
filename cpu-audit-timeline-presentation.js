(function(root){
'use strict';
// Pure, read-only presentation for aggregate advisory timeline summaries.
const exports=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-timeline-export'):root.HFMCPUAuditTimelineExport;
function lines(input){
 const v=exports.validate(input);
 return Object.freeze([
  'Franchise audit timeline (aggregate, read-only)',
  'Reports: '+v.reportCount,
  'Reviews flagged: '+v.reviewCount,
  'Transitions: '+v.transitionCount,
  'Latest review required: '+(v.latestReviewRequired===null?'no reports':v.latestReviewRequired?'yes':'no')
 ]);
}
function describe(input){return lines(input).join('\n');}
const api=Object.freeze({lines,describe});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditTimelinePresentation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
