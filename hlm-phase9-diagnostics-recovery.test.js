'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, 'phase9-diagnostics.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'diagnostics script exists');
const ids = ['payload','result','download','package-file','inspect','clear'];
const elements = Object.fromEntries(ids.map(id => [id, {
 value: '', textContent: '', disabled: id === 'download', files: [],
 handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; },
 click() { if(this.handlers.click) return this.handlers.click(); }
}]));
const context = {
 document: { getElementById: id => elements[id] },
 TextEncoder, Math, JSON, Blob, URL: {createObjectURL(){return 'blob:test'}, revokeObjectURL(){}},
 setTimeout() {}
};
vm.runInNewContext(script[1], context);
const payload=elements.payload, result=elements.result, download=elements.download;
function inspect(value) {payload.value=value; elements.inspect.click();}
function assertBlocked(label) {assert.equal(download.disabled,true,label);assert.match(result.textContent,/Inspect|failed|changed|No package/i,label);}
inspect('{broken');
assertBlocked('malformed JSON');
inspect('{}');
assertBlocked('wrong package type');
payload.value='edited';
payload.handlers.input();
assertBlocked('manual edit invalidates inspection');
elements.clear.click();
assertBlocked('clear invalidates inspection');
assert.equal(payload.value,'');

// A verified package must become downloadable, then lose approval on any edit.
const {fingerprintGameBatchAuditReview:fingerprint}=require('./hlm-phase9-batch-audit-review-manifest');
const files={'diagnostics.json':JSON.stringify({valid:true}),'diagnostics.csv':'name,value\\nA,1','diagnostics.txt':'valid'};
const manifest={valid:true,jsonFingerprint:fingerprint(files['diagnostics.json']),csvFingerprint:fingerprint(files['diagnostics.csv']),textFingerprint:fingerprint(files['diagnostics.txt'])};
const validPackage=JSON.stringify({kind:'phase9-game-batch-audit-review-diagnostics-package',version:1,valid:true,files,manifest});
inspect(validPackage);
assert.equal(download.disabled,false,'valid package enables download');
payload.value=validPackage+' ';
download.click();
assertBlocked('download refuses changed package even without input event');
inspect(validPackage);
assert.equal(download.disabled,false,'reinspection restores approval');
payload.handlers.input();
assertBlocked('editing previously approved package disables download');

console.log('Mission 566 diagnostics recovery positive and negative checks passed');

// Local file selection invalidates prior approval before its asynchronous read completes.
(async () => {
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before file selection');
  let resolveRead;
  const pending = new Promise(resolve => { resolveRead=resolve; });
  elements['package-file'].files=[{size:validPackage.length,text:()=>pending}];
  const change=elements['package-file'].handlers.change();
  assert.equal(download.disabled,true,'new file selection revokes approval immediately');
  assert.match(result.textContent,/Reading local file/);
  resolveRead(validPackage);
  await change;
  assert.equal(payload.value,validPackage,'file content loaded');
  assert.equal(download.disabled,true,'loaded file still requires explicit inspection');
  inspect(payload.value);
  assert.equal(download.disabled,false,'inspection restores download after loading');
  elements.clear.click();
  assert.equal(download.disabled,true,'clear revokes approval after file selection');
  console.log('Mission 570 file selection recovery checks passed');
  let finishOld, finishNew;
  const oldRead=new Promise(resolve=>{finishOld=resolve;});
  const newRead=new Promise(resolve=>{finishNew=resolve;});
  elements['package-file'].files=[{size:100,text:()=>oldRead}];
  const first=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:100,text:()=>newRead}];
  const second=elements['package-file'].handlers.change();
  finishNew('{"new":true}');
  await second;
  assert.equal(payload.value,'{"new":true}','newer selection loaded');
  finishOld('{"old":true}');
  await first;
  assert.equal(payload.value,'{"new":true}','older read ignored');
  assert.equal(download.disabled,true,'new file remains unapproved');
  console.log('Mission 571 out-of-order file read checks passed');
  // A failed current read reports an error without approving or retaining stale content.
  elements['package-file'].files=[{size:100,text:()=>Promise.reject(new Error('disk unavailable'))}];
  const failed=elements['package-file'].handlers.change();
  await failed;
  assert.equal(payload.value,'','failed latest read clears stale payload');
  assert.match(result.textContent,/Unable to read file: disk unavailable/);
  assert.equal(download.disabled,true,'failed read cannot be downloaded');
  // A stale rejected read cannot clear a newer successfully loaded package.
  let rejectOld;
  const staleFailure=new Promise((resolve,reject)=>{rejectOld=reject;});
  elements['package-file'].files=[{size:100,text:()=>staleFailure}];
  const oldFailure=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:100,text:()=>Promise.resolve('{"latest":true}')}];
  const latest=elements['package-file'].handlers.change();
  await latest;
  rejectOld(new Error('old read failed'));
  await oldFailure;
  assert.equal(payload.value,'{"latest":true}','stale read failure leaves newer payload intact');
  assert.match(result.textContent,/File loaded/,'stale failure does not replace success message');
  assert.equal(download.disabled,true,'latest payload requires inspection');
  console.log('Mission 572 stale file failure recovery checks passed');
  // Clearing during a pending file read must keep the workspace empty.
  let resolveAfterClear;
  const pendingClear=new Promise(resolve=>{resolveAfterClear=resolve;});
  elements['package-file'].files=[{size:100,text:()=>pendingClear}];
  const clearRead=elements['package-file'].handlers.change();
  elements.clear.click();
  assert.equal(payload.value,'','clear empties workspace immediately');
  resolveAfterClear(validPackage);
  await clearRead;
  assert.equal(payload.value,'','late file read cannot repopulate cleared workspace');
  assert.equal(result.textContent,'No package inspected.','clear status remains visible');
  assert.equal(download.disabled,true,'cleared workspace cannot download');
  console.log('Mission 573 clear-during-read checks passed');
  // Manual edits during a pending read take precedence over the delayed file.
  let resolveAfterEdit;
  const pendingEdit=new Promise(resolve=>{resolveAfterEdit=resolve;});
  elements['package-file'].files=[{size:100,text:()=>pendingEdit}];
  const editRead=elements['package-file'].handlers.change();
  payload.value='{"manual":true}';
  payload.handlers.input();
  resolveAfterEdit(validPackage);
  await editRead;
  assert.equal(payload.value,'{"manual":true}','delayed read cannot overwrite manual edit');
  assert.match(result.textContent,/Package changed/,'edit message remains visible');
  assert.equal(download.disabled,true,'manual edits require inspection');
  console.log('Mission 574 edit-during-read checks passed');
  // Inspection while a read is pending invalidates that read's revision.
  let resolveAfterInspect;
  const pendingInspect=new Promise(resolve=>{resolveAfterInspect=resolve;});
  payload.value=validPackage;
  elements['package-file'].files=[{size:100,text:()=>pendingInspect}];
  const inspectRead=elements['package-file'].handlers.change();
  elements.inspect.click();
  assert.equal(download.disabled,false,'current valid payload can be inspected');
  assert.match(result.textContent,/PACKAGE FINGERPRINTS VERIFIED/);
  resolveAfterInspect('{"outdated":true}');
  await inspectRead;
  assert.equal(payload.value,validPackage,'late read cannot replace inspected payload');
  assert.equal(download.disabled,false,'stale read cannot revoke current approval');
  assert.match(result.textContent,/PACKAGE FINGERPRINTS VERIFIED/,'verified status remains');
  console.log('Mission 575 inspect-during-read checks passed');
  // Oversized local files must be rejected before any read or download approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package approved before oversize selection');
  let oversizedReadCalled=false;
  elements['package-file'].files=[{size:5*1024*1024+1,text:()=>{oversizedReadCalled=true;return Promise.resolve('bad');}}];
  await elements['package-file'].handlers.change();
  assert.equal(oversizedReadCalled,false,'oversized file is never read');
  assert.equal(download.disabled,true,'oversized selection revokes prior approval');
  assert.match(result.textContent,/File exceeds 5 MB limit/,'size limit explained');
  assert.equal(elements['package-file'].value,'','oversized file picker cleared');
  assert.equal(payload.value,validPackage,'oversized selection does not overwrite text');
  console.log('Mission 576 oversized file guard checks passed');
  // Exact boundary is accepted, but content still needs inspection.
  let boundaryReadCalled=false;
  elements['package-file'].files=[{size:5*1024*1024,text:()=>{boundaryReadCalled=true;return Promise.resolve(validPackage);}}];
  await elements['package-file'].handlers.change();
  assert.equal(boundaryReadCalled,true,'exactly 5 MB file is accepted');
  assert.equal(payload.value,validPackage,'boundary file content loaded');
  assert.equal(download.disabled,true,'boundary file still requires inspection');
  assert.match(result.textContent,/File loaded/);
  console.log('Mission 577 exact file size boundary checks passed');
  // Canceling the picker invalidates approval without altering existing text.
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before picker cancellation');
  elements['package-file'].files=[];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,validPackage,'canceled selection preserves current text');
  assert.equal(download.disabled,true,'canceled selection revokes download approval');
  assert.match(result.textContent,/Select a diagnostics file to inspect/,'cancel displays neutral status');
  console.log('Mission 578 file picker cancellation checks passed');
  // Canceling a subsequent selection must invalidate an earlier pending read.
  let resolveCanceledRead;
  const pendingCanceledRead=new Promise(resolve=>{resolveCanceledRead=resolve;});
  payload.value='{"keep":true}';
  elements['package-file'].files=[{size:100,text:()=>pendingCanceledRead}];
  const firstCanceledRead=elements['package-file'].handlers.change();
  elements['package-file'].files=[];
  await elements['package-file'].handlers.change();
  resolveCanceledRead('{"outdated":true}');
  await firstCanceledRead;
  assert.equal(payload.value,'{"keep":true}','cancellation blocks previous pending read');
  assert.match(result.textContent,/Select a diagnostics file to inspect/);
  assert.equal(download.disabled,true,'canceled pending read cannot approve download');
  console.log('Mission 579 cancel-pending-read checks passed');
  // Mission 580: malformed file structures cannot be approved.
  inspect('[]');
  assert.equal(download.disabled,true,'array package rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  inspect(JSON.stringify({...JSON.parse(validPackage),files:null}));
  assert.equal(download.disabled,true,'missing files rejected');
  assert.match(result.textContent,/Not a recognized/);
  console.log('Mission 580 malformed package structure checks passed');

  // Mission 581: a missing required diagnostics artifact is rejected.
  const missingFile=JSON.parse(validPackage);
  delete missingFile.files['diagnostics.csv'];
  inspect(JSON.stringify(missingFile));
  assert.equal(download.disabled,true,'missing diagnostics CSV rejected');
  assert.match(result.textContent,/Missing required file: diagnostics.csv/);
  console.log('Mission 581 missing diagnostics artifact checks passed');

  // Mission 582: content tampering must fail fingerprint verification.
  const tampered=JSON.parse(validPackage);
  tampered.files['diagnostics.txt']='altered after export';
  inspect(JSON.stringify(tampered));
  assert.equal(download.disabled,true,'tampered content rejected');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.txt/);
  console.log('Mission 582 tampered fingerprint checks passed');

  // Mission 583: inconsistent validity declarations cannot pass verification.
  const mismatch=JSON.parse(validPackage);
  mismatch.manifest.valid=false;
  inspect(JSON.stringify(mismatch));
  assert.equal(download.disabled,true,'validity mismatch rejected');
  assert.match(result.textContent,/validity does not match package/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package still works after invalid inputs');
  console.log('Mission 583 validity mismatch and recovery checks passed');
  // Mission 584: missing and incorrect package versions are rejected.
  const wrongVersion=JSON.parse(validPackage);
  wrongVersion.version=2;
  inspect(JSON.stringify(wrongVersion));
  assert.equal(download.disabled,true,'unsupported version rejected');
  assert.match(result.textContent,/Not a recognized/);
  console.log('Mission 584 package version checks passed');

  // Mission 585: required file entries must be strings.
  const nonStringFile=JSON.parse(validPackage);
  nonStringFile.files['diagnostics.json']={valid:true};
  inspect(JSON.stringify(nonStringFile));
  assert.equal(download.disabled,true,'non-string diagnostics JSON rejected');
  assert.match(result.textContent,/Missing required file: diagnostics.json/);
  console.log('Mission 585 diagnostics artifact type checks passed');

  // Mission 586: a missing or incorrect fingerprint cannot be accepted.
  const missingFingerprint=JSON.parse(validPackage);
  delete missingFingerprint.manifest.csvFingerprint;
  inspect(JSON.stringify(missingFingerprint));
  assert.equal(download.disabled,true,'missing CSV fingerprint rejected');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.csv/);
  console.log('Mission 586 fingerprint metadata checks passed');

  // Mission 587: syntactically broken nested JSON must not approve a download.
  const brokenNested=JSON.parse(validPackage);
  brokenNested.files['diagnostics.json']='{broken';
  brokenNested.manifest.jsonFingerprint=fingerprint(brokenNested.files['diagnostics.json']);
  inspect(JSON.stringify(brokenNested));
  assert.equal(download.disabled,true,'invalid nested diagnostics JSON rejected');
  assert.match(result.textContent,/Inspection failed/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package recovers after nested JSON failure');
  console.log('Mission 587 nested JSON recovery checks passed');
  // Mission 588: reject mismatched JSON content validity even with a valid fingerprint.
  const detailMismatch=JSON.parse(validPackage);
  detailMismatch.files['diagnostics.json']=JSON.stringify({valid:false});
  detailMismatch.manifest.jsonFingerprint=fingerprint(detailMismatch.files['diagnostics.json']);
  inspect(JSON.stringify(detailMismatch));
  assert.equal(download.disabled,true,'nested validity mismatch rejected');
  assert.match(result.textContent,/validity does not match package/);
  console.log('Mission 588 nested validity mismatch checks passed');

  // Mission 589: every required artifact fingerprint is checked.
  for(const [name,expected] of [['diagnostics.json','jsonFingerprint'],['diagnostics.csv','csvFingerprint'],['diagnostics.txt','textFingerprint']]){
    const altered=JSON.parse(validPackage);
    altered.manifest[expected]='00000000-0';
    inspect(JSON.stringify(altered));
    assert.equal(download.disabled,true,name+' altered fingerprint rejected');
    assert.match(result.textContent,/Integrity fingerprint mismatch/);
  }
  console.log('Mission 589 all artifact fingerprint checks passed');

  // Mission 590: non-object nested JSON cannot be treated as valid diagnostics.
  const nullDetails=JSON.parse(validPackage);
  nullDetails.files['diagnostics.json']='null';
  nullDetails.manifest.jsonFingerprint=fingerprint('null');
  inspect(JSON.stringify(nullDetails));
  assert.equal(download.disabled,true,'null diagnostics details rejected');
  assert.match(result.textContent,/validity does not match package/);
  console.log('Mission 590 null nested diagnostics checks passed');

  // Mission 591: invalid input after valid approval revokes download immediately.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package approved before invalid reinspection');
  inspect('{');
  assert.equal(download.disabled,true,'failed reinspection revokes previous approval');
  inspect(validPackage);
  assert.equal(download.disabled,false,'successful reinspection restores approval');
  console.log('Mission 591 approval revocation and recovery checks passed');
  // Mission 592: unsupported package kind is never accepted.
  const wrongKind=JSON.parse(validPackage);
  wrongKind.kind='unrelated-package';
  inspect(JSON.stringify(wrongKind));
  assert.equal(download.disabled,true,'unsupported package kind rejected');
  assert.match(result.textContent,/Not a recognized/);
  console.log('Mission 592 package kind checks passed');

  // Mission 593: absent manifest is rejected before fingerprint checks.
  const missingManifest=JSON.parse(validPackage);
  delete missingManifest.manifest;
  inspect(JSON.stringify(missingManifest));
  assert.equal(download.disabled,true,'missing manifest rejected');
  assert.match(result.textContent,/Not a recognized/);
  console.log('Mission 593 missing manifest checks passed');

  // Mission 594: arrays cannot stand in for a diagnostics package object.
  inspect('[1,2,3]');
  assert.equal(download.disabled,true,'array package rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 594 array root checks passed');

  // Mission 595: an empty payload cannot inherit prior verification approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before empty input');
  inspect('');
  assert.equal(download.disabled,true,'empty payload rejects prior approval');
  assert.match(result.textContent,/Inspection failed/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package recovers after empty input');
  console.log('Mission 595 empty payload recovery checks passed');
  // Mission 596: a boolean root cannot be inspected as a package.
  inspect('true');
  assert.equal(download.disabled,true,'boolean root rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 596 boolean root checks passed');

  // Mission 597: a number root cannot be inspected as a package.
  inspect('42');
  assert.equal(download.disabled,true,'number root rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 597 numeric root checks passed');

  // Mission 598: a string root cannot be inspected as a package.
  inspect('"not a package"');
  assert.equal(download.disabled,true,'string root rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 598 string root checks passed');

  // Mission 599: whitespace-only input must revoke previous approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before whitespace input');
  inspect('   ');
  assert.equal(download.disabled,true,'whitespace-only input revokes approval');
  assert.match(result.textContent,/Inspection failed/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid inspection recovers after whitespace');
  console.log('Mission 599 whitespace input recovery checks passed');
  // Mission 600: null root is rejected with a specific object requirement.
  inspect('null');
  assert.equal(download.disabled,true,'null root rejected');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 600 null root guard passed');

  // Mission 601: missing required text artifact is rejected.
  const missingText=JSON.parse(validPackage);
  delete missingText.files['diagnostics.txt'];
  inspect(JSON.stringify(missingText));
  assert.equal(download.disabled,true,'missing text artifact rejected');
  assert.match(result.textContent,/Missing required file: diagnostics.txt/);
  console.log('Mission 601 missing text artifact guard passed');

  // Mission 602: missing JSON fingerprint fails inspection.
  const missingJsonHash=JSON.parse(validPackage);
  delete missingJsonHash.manifest.jsonFingerprint;
  inspect(JSON.stringify(missingJsonHash));
  assert.equal(download.disabled,true,'missing JSON fingerprint rejected');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.json/);
  console.log('Mission 602 missing JSON fingerprint guard passed');

  // Mission 603: malformed JSON after approval revokes access, then recovers.
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved');
  inspect('{"kind":');
  assert.equal(download.disabled,true,'malformed JSON revokes approval');
  assert.match(result.textContent,/Inspection failed/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid reinspection restores approval');
  console.log('Mission 603 malformed JSON recovery passed');
  // Mission 604: an oversized file never invokes its text reader.
  let mission604OversizedReadCalled=false;
  payload.value='{"preserve":true}';
  elements['package-file'].files=[{size:5*1024*1024+1,text:()=>{mission604OversizedReadCalled=true;return Promise.resolve('bad');}}];
  await elements['package-file'].handlers.change();
  assert.equal(mission604OversizedReadCalled,false,'oversized file reader not invoked');
  assert.equal(payload.value,'{"preserve":true}','oversized file preserves input');
  assert.match(result.textContent,/File exceeds 5 MB limit/);
  assert.equal(download.disabled,true,'oversized file cannot approve download');
  console.log('Mission 604 oversized file guard passed');

  // Mission 605: oversize selection invalidates an earlier pending file read.
  let finishBeforeOversize;
  const beforeOversize=new Promise(resolve=>{finishBeforeOversize=resolve;});
  elements['package-file'].files=[{size:100,text:()=>beforeOversize}];
  const earlierRead=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:5*1024*1024+1,text:()=>Promise.resolve('bad')}];
  await elements['package-file'].handlers.change();
  finishBeforeOversize('{"stale":true}');
  await earlierRead;
  assert.equal(payload.value,'{"preserve":true}','oversize blocks stale pending read');
  assert.match(result.textContent,/File exceeds 5 MB limit/);
  console.log('Mission 605 oversize pending-read race passed');

  // Mission 606: inspection during a pending read invalidates the stale read.
  let finishBeforeInspect;
  const beforeInspect=new Promise(resolve=>{finishBeforeInspect=resolve;});
  elements['package-file'].files=[{size:100,text:()=>beforeInspect}];
  const readBeforeInspect=elements['package-file'].handlers.change();
  inspect(validPackage);
  assert.equal(download.disabled,false,'explicit inspection approves current valid payload');
  finishBeforeInspect('{"stale":true}');
  await readBeforeInspect;
  assert.equal(payload.value,validPackage,'stale read cannot overwrite inspected payload');
  assert.equal(download.disabled,false,'stale read cannot revoke successful inspection');
  console.log('Mission 606 inspect-during-read race passed');

  // Mission 607: manual edits during pending reads take priority over file completion.
  let finishBeforeEdit;
  const beforeEdit=new Promise(resolve=>{finishBeforeEdit=resolve;});
  elements['package-file'].files=[{size:100,text:()=>beforeEdit}];
  const readBeforeEdit=elements['package-file'].handlers.change();
  payload.value='manual edit wins';
  payload.handlers.input();
  finishBeforeEdit('{"stale":true}');
  await readBeforeEdit;
  assert.equal(payload.value,'manual edit wins','manual edit blocks stale file completion');
  assert.equal(download.disabled,true,'manual edit remains unapproved');
  console.log('Mission 607 edit-during-read race passed');
  // Mission 608: an empty local file loads as text but remains unapproved.
  elements['package-file'].files=[{size:0,text:()=>Promise.resolve('')}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,'','empty file contents loaded');
  assert.equal(download.disabled,true,'empty file remains unapproved');
  assert.match(result.textContent,/File loaded/);
  console.log('Mission 608 empty local file passed');

  // Mission 609: a file read rejection reports its error and blocks download.
  elements['package-file'].files=[{size:100,text:()=>Promise.reject(new Error('permission denied'))}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,'','failed read clears stale text');
  assert.equal(download.disabled,true,'failed read remains unapproved');
  assert.match(result.textContent,/Unable to read file: permission denied/);
  console.log('Mission 609 failed file read passed');

  // Mission 610: a valid file read still needs explicit inspection.
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,validPackage,'valid file content loaded');
  assert.equal(download.disabled,true,'loaded file requires inspection');
  inspect(payload.value);
  assert.equal(download.disabled,false,'explicit inspection approves loaded package');
  console.log('Mission 610 file inspection approval passed');

  // Mission 611: a new invalid selection revokes approval without erasing input.
  elements['package-file'].files=[{size:5*1024*1024+1,text:()=>Promise.resolve('oversize')}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,validPackage,'oversized selection preserves inspected text');
  assert.equal(download.disabled,true,'oversized selection revokes previous approval');
  assert.match(result.textContent,/File exceeds 5 MB limit/);
  console.log('Mission 611 invalid selection approval revocation passed');
  // Mission 612: changing text after approval revokes the download.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid fixture approved');
  payload.value=validPackage+' ';
  payload.handlers.input();
  assert.equal(download.disabled,true,'typing invalidates approval');
  assert.match(result.textContent,/Package changed/);
  console.log('Mission 612 text edit approval guard passed');

  // Mission 613: clearing an approved package erases it and revokes download.
  inspect(validPackage);
  elements.clear.click();
  assert.equal(payload.value,'','clear erases payload');
  assert.equal(download.disabled,true,'clear revokes approval');
  assert.match(result.textContent,/No package inspected/);
  console.log('Mission 613 clear approval guard passed');

  // Mission 614: a failed inspection must not leave a previous approval active.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid fixture approved');
  const badManifest=JSON.parse(validPackage);
  badManifest.manifest.textFingerprint='not-the-real-hash';
  inspect(JSON.stringify(badManifest));
  assert.equal(download.disabled,true,'failed inspection revokes approval');
  assert.match(result.textContent,/Integrity fingerprint mismatch/);
  console.log('Mission 614 failed reinspection approval guard passed');

  // Mission 615: approval can only return through explicit valid inspection.
  payload.value=validPackage;
  payload.handlers.input();
  assert.equal(download.disabled,true,'replacing text alone cannot approve');
  inspect(payload.value);
  assert.equal(download.disabled,false,'explicit valid inspection restores approval');
  console.log('Mission 615 explicit reinspection guard passed');


















})().catch(error=>{console.error(error);process.exitCode=1;});



