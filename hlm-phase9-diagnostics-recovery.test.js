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
  // Mission 616: unknown package versions remain blocked even when fingerprints match.
  const unsupportedVersion=JSON.parse(validPackage);
  unsupportedVersion.version=999;
  inspect(JSON.stringify(unsupportedVersion));
  assert.equal(download.disabled,true,'future version is not implicitly trusted');
  assert.match(result.textContent,/Not a recognized/);
  console.log('Mission 616 unsupported future version passed');

  // Mission 617: nested diagnostics validity cannot differ from the package.
  const conflictingDetails=JSON.parse(validPackage);
  conflictingDetails.files['diagnostics.json']=JSON.stringify({valid:false});
  conflictingDetails.manifest.jsonFingerprint=fingerprint(conflictingDetails.files['diagnostics.json']);
  inspect(JSON.stringify(conflictingDetails));
  assert.equal(download.disabled,true,'conflicting nested validity rejected');
  assert.match(result.textContent,/validity does not match package/);
  console.log('Mission 617 conflicting nested validity passed');

  // Mission 618: package and manifest validity must match exactly.
  const conflictingManifest=JSON.parse(validPackage);
  conflictingManifest.valid=false;
  inspect(JSON.stringify(conflictingManifest));
  assert.equal(download.disabled,true,'conflicting manifest validity rejected');
  assert.match(result.textContent,/validity does not match package/);
  console.log('Mission 618 conflicting manifest validity passed');

  // Mission 619: a rejected package must not prevent later valid approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package restores approval after rejected cases');
  payload.value='changed after approval';
  download.click();
  assert.equal(download.disabled,true,'download guard detects silent edits');
  assert.match(result.textContent,/Package changed or is not verified/);
  console.log('Mission 619 silent edit download guard passed');
  // Mission 620: an empty file selection cannot approve a download.
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before canceled selection');
  elements['package-file'].files=[];
  await elements['package-file'].handlers.change();
  assert.equal(download.disabled,true,'empty selection revokes approval');
  assert.equal(payload.value,validPackage,'empty selection retains existing text');
  assert.match(result.textContent,/Select a diagnostics file to inspect/);
  console.log('Mission 620 empty selection approval guard passed');

  // Mission 621: a read that resolves after clear cannot restore removed text.
  let finishAfterClear;
  const pendingAfterClear=new Promise(resolve=>{finishAfterClear=resolve;});
  elements['package-file'].files=[{size:100,text:()=>pendingAfterClear}];
  const clearRaceRead=elements['package-file'].handlers.change();
  elements.clear.click();
  finishAfterClear(validPackage);
  await clearRaceRead;
  assert.equal(payload.value,'','clear wins over pending read');
  assert.equal(download.disabled,true,'clear keeps download disabled');
  console.log('Mission 621 clear-during-read guard passed');

  // Mission 622: canceled selection blocks a late rejection from an older read.
  let rejectAfterCancel;
  const pendingReject=new Promise((resolve,reject)=>{rejectAfterCancel=reject;});
  payload.value='retained';
  elements['package-file'].files=[{size:100,text:()=>pendingReject}];
  const canceledRejectRead=elements['package-file'].handlers.change();
  elements['package-file'].files=[];
  await elements['package-file'].handlers.change();
  rejectAfterCancel(new Error('obsolete failure'));
  await canceledRejectRead;
  assert.equal(payload.value,'retained','canceled stale rejection preserves text');
  assert.match(result.textContent,/Select a diagnostics file to inspect/);
  console.log('Mission 622 canceled stale rejection guard passed');

  // Mission 623: a valid selection after cancellation loads without approving.
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,validPackage,'fresh selection loads after cancellation');
  assert.equal(download.disabled,true,'fresh selection still requires inspection');
  inspect(payload.value);
  assert.equal(download.disabled,false,'explicit inspection approves fresh selection');
  console.log('Mission 623 post-cancel valid selection guard passed');
  // Mission 624: a file at the size limit remains eligible for reading.
  let boundaryReadInvoked=false;
  elements['package-file'].files=[{size:5*1024*1024,text:()=>{boundaryReadInvoked=true;return Promise.resolve(validPackage);}}];
  await elements['package-file'].handlers.change();
  assert.equal(boundaryReadInvoked,true,'exact 5 MB file is read');
  assert.equal(payload.value,validPackage,'boundary file content loaded');
  assert.equal(download.disabled,true,'boundary file still needs inspection');
  console.log('Mission 624 exact size limit passed');

  // Mission 625: a file one byte over the limit is not read.
  let overBoundaryReadInvoked=false;
  elements['package-file'].files=[{size:5*1024*1024+1,text:()=>{overBoundaryReadInvoked=true;return Promise.resolve('bad');}}];
  await elements['package-file'].handlers.change();
  assert.equal(overBoundaryReadInvoked,false,'one-byte oversized file is blocked');
  assert.equal(payload.value,validPackage,'oversized file retains previous text');
  assert.match(result.textContent,/File exceeds 5 MB limit/);
  console.log('Mission 625 one-byte oversize limit passed');

  // Mission 626: a selected file with an empty body cannot pass inspection.
  elements['package-file'].files=[{size:0,text:()=>Promise.resolve('')}];
  await elements['package-file'].handlers.change();
  inspect(payload.value);
  assert.equal(download.disabled,true,'empty file cannot pass inspection');
  assert.match(result.textContent,/Inspection failed/);
  console.log('Mission 626 empty file inspection passed');

  // Mission 627: a valid file can be loaded after a rejected oversized selection.
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  assert.equal(payload.value,validPackage,'valid file loads after oversize rejection');
  assert.equal(download.disabled,true,'valid file awaits inspection');
  inspect(payload.value);
  assert.equal(download.disabled,false,'valid file approved by inspection');
  console.log('Mission 627 post-oversize recovery passed');
  // Mission 628: a later file selection wins even if the first read resolves last.
  let finishOldRead;
  const mission628OldRead=new Promise(resolve=>{finishOldRead=resolve;});
  elements['package-file'].files=[{size:10,text:()=>mission628OldRead}];
  const firstRead=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  finishOldRead('obsolete file contents');
  await firstRead;
  assert.equal(payload.value,validPackage,'newer file selection wins');
  assert.equal(download.disabled,true,'newer loaded file requires inspection');
  console.log('Mission 628 newer file selection race passed');

  // Mission 629: a stale rejected read cannot overwrite a successful newer read.
  let rejectOldRead;
  const oldRejectedRead=new Promise((resolve,reject)=>{rejectOldRead=reject;});
  elements['package-file'].files=[{size:10,text:()=>oldRejectedRead}];
  const rejectedRead=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  rejectOldRead(new Error('outdated read error'));
  await rejectedRead;
  assert.equal(payload.value,validPackage,'newer read survives stale rejection');
  assert.match(result.textContent,/File loaded/);
  console.log('Mission 629 stale rejected read race passed');

  // Mission 630: user edits during a pending read cannot be overwritten.
  let finishPendingEditRead;
  const pendingEditRead=new Promise(resolve=>{finishPendingEditRead=resolve;});
  elements['package-file'].files=[{size:10,text:()=>pendingEditRead}];
  const pendingManualEditRead=elements['package-file'].handlers.change();
  payload.value='my manual changes';
  payload.handlers.input();
  finishPendingEditRead(validPackage);
  await pendingManualEditRead;
  assert.equal(payload.value,'my manual changes','manual edits override stale file');
  assert.equal(download.disabled,true,'manual edit cannot approve download');
  console.log('Mission 630 manual edit race passed');

  // Mission 631: valid reinspection restores approval after competing reads.
  inspect(validPackage);
  assert.equal(download.disabled,false,'reinspection approves valid package');
  elements['package-file'].files=[{size:validPackage.length,text:()=>Promise.resolve(validPackage)}];
  await elements['package-file'].handlers.change();
  assert.equal(download.disabled,true,'new selection revokes earlier approval');
  inspect(payload.value);
  assert.equal(download.disabled,false,'reinspection restores approval');
  console.log('Mission 631 repeated inspection approval passed');
  // Mission 632: malformed JSON does not enable the download.
  inspect('{"kind":');
  assert.equal(download.disabled,true,'malformed JSON remains unapproved');
  assert.match(result.textContent,/Inspection failed/);
  console.log('Mission 632 malformed JSON guard passed');

  // Mission 633: malformed input cannot preserve an earlier valid approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package approved');
  inspect('[]');
  assert.equal(download.disabled,true,'array root revokes approval');
  assert.match(result.textContent,/Expected a JSON object/);
  console.log('Mission 633 malformed reinspection revocation passed');

  // Mission 634: missing required diagnostics file fails integrity validation.
  const missingCsv=JSON.parse(validPackage);
  delete missingCsv.files['diagnostics.csv'];
  inspect(JSON.stringify(missingCsv));
  assert.equal(download.disabled,true,'missing CSV cannot be approved');
  assert.match(result.textContent,/Missing required file: diagnostics.csv/);
  console.log('Mission 634 missing CSV guard passed');

  // Mission 635: a valid package recovers after consecutive rejected inspections.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package restores approval after failures');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 635 recovery after invalid inspections passed');

  // Mission 636: modified JSON content without a matching fingerprint is rejected.
  const mission636=JSON.parse(validPackage);
  mission636.files['diagnostics.json']=JSON.stringify({valid:false});
  inspect(JSON.stringify(mission636));
  assert.equal(download.disabled,true,'tampered JSON cannot be downloaded');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.json/);
  console.log('Mission 636 JSON fingerprint tamper guard passed');

  // Mission 637: modified CSV content cannot reuse the previous approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid fixture restores approval');
  const mission637=JSON.parse(validPackage);
  mission637.files['diagnostics.csv']+='\\nextra,row';
  inspect(JSON.stringify(mission637));
  assert.equal(download.disabled,true,'tampered CSV revokes approval');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.csv/);
  console.log('Mission 637 CSV fingerprint tamper guard passed');

  // Mission 638: modified text diagnostics fail the independent fingerprint check.
  const mission638=JSON.parse(validPackage);
  mission638.files['diagnostics.txt']='changed diagnostics';
  inspect(JSON.stringify(mission638));
  assert.equal(download.disabled,true,'tampered text cannot be downloaded');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.txt/);
  console.log('Mission 638 text fingerprint tamper guard passed');

  // Mission 639: consistent fingerprints cannot mask a contradictory validity declaration.
  const mission639=JSON.parse(validPackage);
  mission639.valid=false;
  inspect(JSON.stringify(mission639));
  assert.equal(download.disabled,true,'contradictory validity cannot be approved');
  assert.match(result.textContent,/Diagnostics or manifest validity does not match package/);
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package remains recoverable after integrity failures');
  console.log('Mission 639 validity consistency and recovery passed');
























  // Mission 640: missing diagnostics.json must invalidate prior approval.
  inspect(validPackage);
  assert.equal(download.disabled,false);
  const mission640=JSON.parse(validPackage);
  delete mission640.files['diagnostics.json'];
  inspect(JSON.stringify(mission640));
  assert.equal(download.disabled,true,'missing JSON revokes approval');
  assert.match(result.textContent,/Missing required file: diagnostics.json/);
  console.log('Mission 640 missing JSON guard passed');

  // Mission 641: missing diagnostics.txt must not be approved.
  const mission641=JSON.parse(validPackage);
  delete mission641.files['diagnostics.txt'];
  inspect(JSON.stringify(mission641));
  assert.equal(download.disabled,true,'missing text revokes approval');
  assert.match(result.textContent,/Missing required file: diagnostics.txt/);
  console.log('Mission 641 missing text guard passed');

  // Mission 642: a missing CSV fingerprint is rejected even if file contents are intact.
  const mission642=JSON.parse(validPackage);
  delete mission642.manifest.csvFingerprint;
  inspect(JSON.stringify(mission642));
  assert.equal(download.disabled,true,'missing fingerprint blocks approval');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.csv/);
  console.log('Mission 642 missing CSV fingerprint guard passed');

  // Mission 643: a valid package can be approved after all three failures.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 643 required file and fingerprint recovery passed');

  // Mission 644: a missing JSON fingerprint cannot approve otherwise intact content.
  const mission644=JSON.parse(validPackage);
  delete mission644.manifest.jsonFingerprint;
  inspect(JSON.stringify(mission644));
  assert.equal(download.disabled,true,'missing JSON fingerprint blocks download');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.json/);
  console.log('Mission 644 missing JSON fingerprint passed');

  // Mission 645: a missing text fingerprint cannot approve otherwise intact content.
  const mission645=JSON.parse(validPackage);
  delete mission645.manifest.textFingerprint;
  inspect(JSON.stringify(mission645));
  assert.equal(download.disabled,true,'missing text fingerprint blocks download');
  assert.match(result.textContent,/Integrity fingerprint mismatch: diagnostics.txt/);
  console.log('Mission 645 missing text fingerprint passed');

  // Mission 646: the manifest validity must agree with the package and diagnostics.
  const mission646=JSON.parse(validPackage);
  mission646.manifest.valid=false;
  inspect(JSON.stringify(mission646));
  assert.equal(download.disabled,true,'contradictory manifest validity blocks download');
  assert.match(result.textContent,/Diagnostics or manifest validity does not match package/);
  console.log('Mission 646 contradictory manifest validity passed');

  // Mission 647: approval can recover only after a fresh valid inspection.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package can recover from manifest failures');
  payload.value=validPackage+' ';
  download.click();
  assert.equal(download.disabled,true,'silent payload change revokes approval');
  inspect(validPackage);
  assert.equal(download.disabled,false,'fresh inspection restores approval');
  console.log('Mission 647 manifest recovery and approval revocation passed');

  // Mission 648: a non-object diagnostics JSON payload must fail validity checks.
  const mission648=JSON.parse(validPackage);
  mission648.files['diagnostics.json']='null';
  mission648.manifest.jsonFingerprint=fingerprint(mission648.files['diagnostics.json']);
  inspect(JSON.stringify(mission648));
  assert.equal(download.disabled,true,'null diagnostics cannot be approved');
  assert.match(result.textContent,/Diagnostics or manifest validity does not match package/);
  console.log('Mission 648 null diagnostics structure passed');

  // Mission 649: malformed diagnostics JSON must not be approved, even with matching fingerprint.
  const mission649=JSON.parse(validPackage);
  mission649.files['diagnostics.json']='{"valid":';
  mission649.manifest.jsonFingerprint=fingerprint(mission649.files['diagnostics.json']);
  inspect(JSON.stringify(mission649));
  assert.equal(download.disabled,true,'malformed diagnostics JSON cannot be approved');
  assert.match(result.textContent,/Inspection failed/);
  console.log('Mission 649 malformed diagnostics structure passed');

  // Mission 650: a matching fingerprint does not replace the required validity declaration.
  const mission650=JSON.parse(validPackage);
  mission650.files['diagnostics.json']='{}';
  mission650.manifest.jsonFingerprint=fingerprint(mission650.files['diagnostics.json']);
  inspect(JSON.stringify(mission650));
  assert.equal(download.disabled,true,'missing diagnostics validity blocks approval');
  assert.match(result.textContent,/Diagnostics or manifest validity does not match package/);
  console.log('Mission 650 missing diagnostics validity passed');

  // Mission 651: a valid package can recover after three structural failures.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package recovers after structural failures');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 651 diagnostics structural recovery passed');

  // Mission 652: a wrong package kind cannot reuse an earlier approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'baseline package approved');
  const mission652=JSON.parse(validPackage);
  mission652.kind='unrelated-package';
  inspect(JSON.stringify(mission652));
  assert.equal(download.disabled,true,'unrecognized package kind revokes approval');
  assert.match(result.textContent,/Not a recognized Phase 9 diagnostics package/);
  console.log('Mission 652 package kind boundary passed');

  // Mission 653: a future package version must not silently pass version-one inspection.
  const mission653=JSON.parse(validPackage);
  mission653.version=2;
  inspect(JSON.stringify(mission653));
  assert.equal(download.disabled,true,'unsupported package version rejected');
  assert.match(result.textContent,/Not a recognized Phase 9 diagnostics package/);
  console.log('Mission 653 package version boundary passed');

  // Mission 654: a missing manifest is rejected before any download.
  const mission654=JSON.parse(validPackage);
  delete mission654.manifest;
  inspect(JSON.stringify(mission654));
  assert.equal(download.disabled,true,'missing manifest rejected');
  assert.match(result.textContent,/Not a recognized Phase 9 diagnostics package/);
  console.log('Mission 654 missing manifest boundary passed');

  // Mission 655: only a fresh valid inspection restores download approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package recovers after boundary failures');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 655 package boundary recovery passed');

  // Mission 656: a null files container must not be treated as an approved package.
  const mission656=JSON.parse(validPackage);
  mission656.files=null;
  inspect(JSON.stringify(mission656));
  assert.equal(download.disabled,true,'null files container rejected');
  assert.match(result.textContent,/Not a recognized Phase 9 diagnostics package/);
  console.log('Mission 656 null files container passed');

  // Mission 657: a missing files container must revoke earlier approval.
  inspect(validPackage);
  assert.equal(download.disabled,false,'baseline package approved');
  const mission657=JSON.parse(validPackage);
  delete mission657.files;
  inspect(JSON.stringify(mission657));
  assert.equal(download.disabled,true,'missing files container revokes approval');
  assert.match(result.textContent,/Not a recognized Phase 9 diagnostics package/);
  console.log('Mission 657 missing files container passed');

  // Mission 658: a non-string diagnostics CSV file is rejected.
  const mission658=JSON.parse(validPackage);
  mission658.files['diagnostics.csv']=123;
  inspect(JSON.stringify(mission658));
  assert.equal(download.disabled,true,'non-string CSV rejected');
  assert.match(result.textContent,/Missing required file: diagnostics.csv/);
  console.log('Mission 658 non-string CSV guard passed');

  // Mission 659: valid package reinspection restores approval after schema failures.
  inspect(validPackage);
  assert.equal(download.disabled,false,'valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 659 file schema recovery passed');


  // Missions 660–663: reject non-text diagnostic files and recover after rejection.
  const mission660=JSON.parse(validPackage);
  mission660.files["diagnostics.json"]=false;
  inspect(JSON.stringify(mission660));
  assert.equal(download.disabled,true,'Mission 660: invalid file type blocks approval');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);
  console.log('Mission 660 non-text diagnostics.json rejected');

  const mission661=JSON.parse(validPackage);
  mission661.files["diagnostics.txt"]=["invalid"];
  inspect(JSON.stringify(mission661));
  assert.equal(download.disabled,true,'Mission 661: invalid file type blocks approval');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);
  console.log('Mission 661 non-text diagnostics.txt rejected');

  const mission662=JSON.parse(validPackage);
  mission662.files["diagnostics.csv"]={"value":"bad"};
  inspect(JSON.stringify(mission662));
  assert.equal(download.disabled,true,'Mission 662: invalid file type blocks approval');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);
  console.log('Mission 662 non-text diagnostics.csv rejected');

  inspect(validPackage);
  assert.equal(download.disabled,false,'Mission 663: valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Mission 663 schema recovery passed');


  // Missions 664–671: all required files reject non-string values; fresh inspection recovers.
  const mission664=JSON.parse(validPackage);
  mission664.files["diagnostics.csv"]=null;
  inspect(JSON.stringify(mission664));
  assert.equal(download.disabled,true,'Mission 664 invalid diagnostics.csv blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission665=JSON.parse(validPackage);
  mission665.files["diagnostics.json"]=null;
  inspect(JSON.stringify(mission665));
  assert.equal(download.disabled,true,'Mission 665 invalid diagnostics.json blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission666=JSON.parse(validPackage);
  mission666.files["diagnostics.txt"]=null;
  inspect(JSON.stringify(mission666));
  assert.equal(download.disabled,true,'Mission 666 invalid diagnostics.txt blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission667=JSON.parse(validPackage);
  mission667.files["diagnostics.csv"]=[];
  inspect(JSON.stringify(mission667));
  assert.equal(download.disabled,true,'Mission 667 invalid diagnostics.csv blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission668=JSON.parse(validPackage);
  mission668.files["diagnostics.json"]={};
  inspect(JSON.stringify(mission668));
  assert.equal(download.disabled,true,'Mission 668 invalid diagnostics.json blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission669=JSON.parse(validPackage);
  mission669.files["diagnostics.txt"]=true;
  inspect(JSON.stringify(mission669));
  assert.equal(download.disabled,true,'Mission 669 invalid diagnostics.txt blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission670=JSON.parse(validPackage);
  mission670.files["diagnostics.csv"]=false;
  inspect(JSON.stringify(mission670));
  assert.equal(download.disabled,true,'Mission 670 invalid diagnostics.csv blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  inspect(validPackage);
  assert.equal(download.disabled,false,'Mission 671 valid package recovers');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Missions 664–671 file schema and recovery passed');

  // Missions 672–679: unexpected file value types never approve an export.
  const mission672=JSON.parse(validPackage);
  mission672.files["diagnostics.json"]=17;
  inspect(JSON.stringify(mission672));
  assert.equal(download.disabled,true,'Mission 672: invalid diagnostics.json blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission673=JSON.parse(validPackage);
  mission673.files["diagnostics.txt"]=0;
  inspect(JSON.stringify(mission673));
  assert.equal(download.disabled,true,'Mission 673: invalid diagnostics.txt blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission674=JSON.parse(validPackage);
  mission674.files["diagnostics.csv"]={};
  inspect(JSON.stringify(mission674));
  assert.equal(download.disabled,true,'Mission 674: invalid diagnostics.csv blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission675=JSON.parse(validPackage);
  mission675.files["diagnostics.json"]=[];
  inspect(JSON.stringify(mission675));
  assert.equal(download.disabled,true,'Mission 675: invalid diagnostics.json blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission676=JSON.parse(validPackage);
  mission676.files["diagnostics.txt"]={};
  inspect(JSON.stringify(mission676));
  assert.equal(download.disabled,true,'Mission 676: invalid diagnostics.txt blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission677=JSON.parse(validPackage);
  mission677.files["diagnostics.csv"]=true;
  inspect(JSON.stringify(mission677));
  assert.equal(download.disabled,true,'Mission 677: invalid diagnostics.csv blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission678=JSON.parse(validPackage);
  mission678.files["diagnostics.json"]=true;
  inspect(JSON.stringify(mission678));
  assert.equal(download.disabled,true,'Mission 678: invalid diagnostics.json blocked');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  inspect(validPackage);
  assert.equal(download.disabled,false,'Mission 679: valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Missions 672–679 diagnostics value type matrix passed');

  // Missions 680–687: malformed required file payload types revoke approval.
  const mission680=JSON.parse(validPackage);
  mission680.files["diagnostics.csv"]=42;
  inspect(JSON.stringify(mission680));
  assert.equal(download.disabled,true,'Mission 680: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission681=JSON.parse(validPackage);
  mission681.files["diagnostics.json"]=false;
  inspect(JSON.stringify(mission681));
  assert.equal(download.disabled,true,'Mission 681: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission682=JSON.parse(validPackage);
  mission682.files["diagnostics.txt"]=[];
  inspect(JSON.stringify(mission682));
  assert.equal(download.disabled,true,'Mission 682: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission683=JSON.parse(validPackage);
  mission683.files["diagnostics.csv"]=["row"];
  inspect(JSON.stringify(mission683));
  assert.equal(download.disabled,true,'Mission 683: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission684=JSON.parse(validPackage);
  mission684.files["diagnostics.json"]=["valid"];
  inspect(JSON.stringify(mission684));
  assert.equal(download.disabled,true,'Mission 684: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission685=JSON.parse(validPackage);
  mission685.files["diagnostics.txt"]={"text":"bad"};
  inspect(JSON.stringify(mission685));
  assert.equal(download.disabled,true,'Mission 685: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission686=JSON.parse(validPackage);
  mission686.files["diagnostics.csv"]={"csv":"bad"};
  inspect(JSON.stringify(mission686));
  assert.equal(download.disabled,true,'Mission 686: malformed file value rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  inspect(validPackage);
  assert.equal(download.disabled,false,'Mission 687: valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Missions 680–687 malformed file type recovery passed');


  // Missions 688–700: required diagnostics files reject malformed values and recover.
  const mission688=JSON.parse(validPackage);
  mission688.files["diagnostics.json"]=0;
  inspect(JSON.stringify(mission688));
  assert.equal(download.disabled,true,'Mission 688: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission689=JSON.parse(validPackage);
  mission689.files["diagnostics.txt"]=42;
  inspect(JSON.stringify(mission689));
  assert.equal(download.disabled,true,'Mission 689: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission690=JSON.parse(validPackage);
  mission690.files["diagnostics.csv"]=null;
  inspect(JSON.stringify(mission690));
  assert.equal(download.disabled,true,'Mission 690: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission691=JSON.parse(validPackage);
  mission691.files["diagnostics.json"]={"unexpected":1};
  inspect(JSON.stringify(mission691));
  assert.equal(download.disabled,true,'Mission 691: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission692=JSON.parse(validPackage);
  mission692.files["diagnostics.txt"]=["text"];
  inspect(JSON.stringify(mission692));
  assert.equal(download.disabled,true,'Mission 692: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission693=JSON.parse(validPackage);
  mission693.files["diagnostics.csv"]=false;
  inspect(JSON.stringify(mission693));
  assert.equal(download.disabled,true,'Mission 693: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission694=JSON.parse(validPackage);
  mission694.files["diagnostics.json"]=true;
  inspect(JSON.stringify(mission694));
  assert.equal(download.disabled,true,'Mission 694: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission695=JSON.parse(validPackage);
  mission695.files["diagnostics.txt"]=null;
  inspect(JSON.stringify(mission695));
  assert.equal(download.disabled,true,'Mission 695: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission696=JSON.parse(validPackage);
  mission696.files["diagnostics.csv"]={"content":"csv"};
  inspect(JSON.stringify(mission696));
  assert.equal(download.disabled,true,'Mission 696: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  const mission697=JSON.parse(validPackage);
  mission697.files["diagnostics.json"]=["json"];
  inspect(JSON.stringify(mission697));
  assert.equal(download.disabled,true,'Mission 697: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.json/);

  const mission698=JSON.parse(validPackage);
  mission698.files["diagnostics.txt"]=false;
  inspect(JSON.stringify(mission698));
  assert.equal(download.disabled,true,'Mission 698: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.txt/);

  const mission699=JSON.parse(validPackage);
  mission699.files["diagnostics.csv"]=123;
  inspect(JSON.stringify(mission699));
  assert.equal(download.disabled,true,'Mission 699: invalid required file rejected');
  assert.match(result.textContent,/Missing required file: diagnostics\.csv/);

  inspect(validPackage);
  assert.equal(download.disabled,false,'Mission 700: valid package restores approval');
  assert.match(result.textContent,/FINGERPRINTS VERIFIED/);
  console.log('Missions 688–700 final Phase 9 diagnostics regression batch passed');

})().catch(error=>{console.error(error);process.exitCode=1;});



