'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {derive,previewSigning}=require('./hlm-phase11-gamestate-finance');
const {advanceWithFinances,writeFinanceSnapshot}=require('./hlm-phase11-finance-state-commit');
/* Explicit isolated finance save store. Never accesses production browser storage. */
function createFinanceSession(adapter,{key='hlm-phase11-finance-preview-v1',enabled=false}={}){
 if(enabled!==true)throw Error('Finance preview must be explicitly enabled');
 if(key==='hlm-phase10-save'||key==='hlm-frontoffice-save')throw Error('Production save key forbidden');
 if(!/^hlm-phase11-finance-preview-[a-z0-9-]+$/.test(key))throw Error('Invalid isolated finance key');
 const store=createFranchiseSaveStore(adapter,key);
 function load(){return store.load()}
 function importState(state,{confirmed=false}={}){if(!confirmed)throw Error('Import confirmation required');if(!validateGameStateEnvelope(state).valid)throw Error('Invalid state');return store.save(JSON.parse(JSON.stringify(state)))}
 function finance(teamId,policy){const state=load();if(!state)throw Error('No finance preview state');return derive(state,teamId,policy)}
 function signing(teamId,policy,salary){const state=load();if(!state)throw Error('No finance preview state');return previewSigning(state,teamId,policy,salary)}
 function snapshot(teamId,policy,{confirmed=false}={}){if(!confirmed)throw Error('Snapshot confirmation required');const state=load();if(!state)throw Error('No finance preview state');const next=writeFinanceSnapshot(state,teamId,policy,{confirmed:true});store.save(next);return next}
 function advance(seed,teamIds,policies,{confirmed=false}={}){if(!confirmed)throw Error('Advance confirmation required');const state=load();if(!state)throw Error('No finance preview state');const result=advanceWithFinances(state,seed,teamIds,policies,{confirmed:true});store.save(result.nextState);return result}
 return Object.freeze({load,importState,finance,signing,snapshot,advance,key});
}
module.exports={createFinanceSession};
