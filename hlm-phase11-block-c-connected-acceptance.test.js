'use strict';
// Block C connects existing real-universe career and protected SQLite settlement
// acceptance without treating their separate experimental stores as one production engine.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {existsSync}=require('node:fs');
const {join}=require('node:path');
const root=__dirname;
const cases=[
  ['real-universe GM-approved multiseason journey','node',['hlm-phase11-real-universe-journey.test.js']],
  ['protected SQLite settlement durability and rollback','python3',['-m','unittest','-v','hlm-phase11-block-b-protected-sqlite-integration.test.py']]
];
for(const [name,command,args] of cases){
  test(name,()=>{
    for(const file of args.filter(x=>/\.(js|py)$/.test(x)))assert.ok(existsSync(join(root,file)),file);
    const result=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
    assert.equal(result.error,undefined,result.error?.message);
    assert.equal(result.status,0,[result.stdout,result.stderr].join('\n'));
  });
}
