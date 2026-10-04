'use strict';
const assert=require('assert');
const { createFrontOfficeRuntimeAdapter, inspectFrontOfficeRuntime }=require('./hlm-front-office-runtime-adapter');

(async()=>{
  const source={players:[{id:1}],teams:[{id:5}],contracts:[{}],transactions:[{},{}],draftPicks:[{}],settings:{controlledTeamId:5}};
  const adapter=createFrontOfficeRuntimeAdapter({readLegacyState:async()=>source});
  assert(Object.isFrozen(adapter));
  const copy=await adapter.readLegacySnapshot();
  copy.players.push({id:2});
  assert.strictEqual(source.players.length,1);
  const report=await inspectFrontOfficeRuntime(adapter);
  assert.deepStrictEqual(report,{readable:true,readOnly:true,playerCount:1,teamCount:1,contractCount:1,transactionCount:2,draftPickCount:1,controlledTeamId:5});
  await assert.rejects(()=>createFrontOfficeRuntimeAdapter({readLegacyState:async()=>null}).readLegacySnapshot(),e=>e.code==='INVALID_FRONT_OFFICE_SNAPSHOT');
  assert.throws(()=>createFrontOfficeRuntimeAdapter({}),/readLegacyState/);
  console.log('Front Office runtime adapter boundary tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});
