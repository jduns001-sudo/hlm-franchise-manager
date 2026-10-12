'use strict';
const assert=require('node:assert/strict');
const {downloadPreparedDiagnosticsFile}=require('./hlm-phase9-browser-diagnostics-download-adapter');
const clicks=[],revoked=[],blobs=[];
class FakeBlob{constructor(parts,options){this.parts=parts;this.options=options;blobs.push(this);}}
const documentRef={createElement:tag=>{
 assert.equal(tag,'a');
 return {click(){clicks.push({href:this.href,download:this.download});}};
}};
const urlRef={createObjectURL:blob=>{assert.ok(blob instanceof FakeBlob);return 'blob:test';},
 revokeObjectURL:url=>revoked.push(url)};
const file={filename:'gm-review-diagnostics.csv',mimeType:'text/csv;charset=utf-8',content:'status,valid\r\nREADY,true\r\n'};
const result=downloadPreparedDiagnosticsFile(file,{documentRef,urlRef,BlobCtor:FakeBlob});
assert.equal(result.downloadTriggered,true);
assert.deepEqual(clicks,[{href:'blob:test',download:file.filename}]);
assert.deepEqual(revoked,['blob:test']);
assert.equal(blobs[0].parts[0],file.content);
assert.equal(result.persistencePerformed,false);
assert.throws(()=>downloadPreparedDiagnosticsFile({...file,filename:'../danger.csv'},{documentRef,urlRef,BlobCtor:FakeBlob}),/prepared GM diagnostics/);
assert.throws(()=>downloadPreparedDiagnosticsFile(file),/Browser download APIs/);
const badDoc={createElement:()=>({click(){throw new Error('click failed');}})};
assert.throws(()=>downloadPreparedDiagnosticsFile(file,{documentRef:badDoc,urlRef,BlobCtor:FakeBlob}),/click failed/);
assert.deepEqual(revoked,['blob:test','blob:test']);
console.log('Mission 545 browser diagnostics download adapter tests passed');
