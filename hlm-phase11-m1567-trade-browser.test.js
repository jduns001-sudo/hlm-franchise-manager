'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {build}=require('./hlm-phase11-m1567-build-trade-browser');
(async()=>{
 const code=build();assert.equal(code,fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-m1567-trade-browser.js'),'utf8'));
 const context=vm.createContext({});vm.runInContext(code,context);
 assert.deepEqual(Object.keys(context),['HLMExperimentalTradeHost'],'bundle only exposes an opt-in factory');
 const host=context.HLMExperimentalTradeHost.createHost();
 assert.equal((await host.review({})).code,'experiment-disabled');assert.equal((await host.settle({gmApproved:true})).saved,false);
 const blocked=context.HLMExperimentalTradeHost.createHost({experimentalEnabled:true,syntheticTestAuthorization:true,experimentalDatabaseName:'hlm_front_office_v8'});
 assert.equal((await blocked.review({})).code,'isolated-experimental-database-required');
 console.log('M1567 generated browser parity, explicit opt-in and production namespace rejection passed');
})().catch(e=>{console.error(e);process.exitCode=1});
