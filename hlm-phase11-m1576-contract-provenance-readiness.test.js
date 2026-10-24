'use strict';
const assert=require('node:assert/strict');
const {create,check}=require('./hlm-phase11-m1576-contract-provenance-readiness');
const document={schemaVersion:1,source:{publisher:'test-publisher',reference:'test-reference',asOfDate:'2026-10-24'}};
const digest='a'.repeat(64),anchor={sha256:digest,publisher:'test-publisher',reference:'test-reference',asOfDate:'2026-10-24',trustedByHost:true};
const inspection={identityMatched:true,saved:false,contractsImported:false,evidenceCompleteForDeclaredScope:true,seasonRevision:1};
const params={document,digest,anchor,inspection,expectedSeasonRevision:1};
assert.equal(check(params).ok,true);
for(const value of [
 {...params,anchor:null},{...params,anchor:{...anchor,trustedByHost:false}},
 {...params,anchor:{...anchor,sha256:'b'.repeat(64)}},
 {...params,anchor:{...anchor,publisher:'other'}},
 {...params,anchor:{...anchor,reference:'other'}},
 {...params,inspection:{...inspection,evidenceCompleteForDeclaredScope:false}},
 {...params,inspection:{...inspection,identityMatched:false}},
 {...params,expectedSeasonRevision:2},
 {...params,digest:'untrusted'}
]){const result=check(value);assert.equal(result.ok,false);assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);}
let state={meta:{revision:1},assets:{contracts:[]}},writes=0;
const get=()=>structuredClone(state);
const absent=create(get);absent.begin();
const blocked=absent.review(document,digest,inspection);
assert.equal(blocked.code,'trusted-host-source-anchor-unavailable');
assert.equal(blocked.contractImportAuthorized,false);
const host=create(get,[anchor]);host.begin();
const reviewed=host.review(document,digest,inspection);
assert.equal(reviewed.ok,true);
assert.equal(reviewed.realSeasonIntegrationReady,false);
assert.equal(reviewed.sourcePublisherAuthenticated,false);
assert.equal(reviewed.cpuConsentAuthenticated,false);
assert.equal(reviewed.saved,false);
assert.deepEqual(state.assets.contracts,[]);
state={...state,meta:{revision:2}};
assert.equal(host.review(document,digest,inspection).code,'stale-saved-season');
assert.equal(host.review(document,digest,inspection).code,'review-required');
host.begin();assert.equal(host.cancel().saved,false);
assert.equal(host.review(document,digest,inspection).code,'review-required');
assert.equal(writes,0);
console.log('M1576 host-pinned evidence: missing anchors fail closed, pinned matching never authorizes rights, wrong hashes/metadata fail, stale and cancellation preserve no-save');
