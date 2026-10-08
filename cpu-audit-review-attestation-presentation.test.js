'use strict';
const assert=require('node:assert/strict');
const summary=require('./cpu-audit-summary-bundle');
const evidence=require('./cpu-audit-review-evidence');
const trends=require('./cpu-audit-review-trend-bundle');
const bundles=require('./cpu-audit-review-attestation-bundle');
const presentation=require('./cpu-audit-review-attestation-presentation');
const clear={kind:'cpu-audit-public-advisory',readOnly:true,requiresReview:false,changed:false,issueTrend:'unchanged',warnings:[]};
const flagged={...clear,requiresReview:true,changed:true,issueTrend:'increased',warnings:['Data issue count increased']};
const a=evidence.create(summary.build([clear]));
const b=evidence.create(summary.build([flagged]));
for(const input of [trends.build([]),trends.build([a]),trends.build([a,b])]){
 const bundle=bundles.create(input);
 const output=presentation.describe(bundle);
 assert.match(output,/read-only/);
 assert.match(output,new RegExp('Snapshots: '+bundle.attestation.snapshotCount));
 assert.match(output,/Human review: (required|not required)/);
 assert.equal(presentation.describe(bundles.parse(bundles.stringify(bundle))),output);
 assert.throws(()=>presentation.describe({...bundle,execute:true}),TypeError);
 assert.throws(()=>presentation.describe({...bundle,attestation:{...bundle.attestation,requiresHumanReview:!bundle.attestation.requiresHumanReview}}),TypeError);
}
console.log('Review attestation presentation tests passed');
