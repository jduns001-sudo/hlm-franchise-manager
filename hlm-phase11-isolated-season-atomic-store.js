'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');
const DEFAULT_KEY='hlm-phase11-isolated-season-v1';
function createIsolatedSeasonStore(adapter,{key=DEFAULT_KEY}={}){
 if(!adapter||typeof adapter.read!=='function'||typeof adapter.write!=='function'||typeof adapter.remove!=='function')throw Error('Read/write/remove storage adapter required');
 if(typeof key!=='string'||!/^hlm-phase11-isolated-season-[\w-]+$/.test(key))throw Error('Isolated Phase 11 save key required');
 const journal=key+'-journal',backup=key+'-backup';
 const parse=raw=>{if(raw==null)return null;const state=JSON.parse(raw);if(!validateGameStateEnvelope(state).valid)throw Error('Invalid isolated season save');return state};
 const read=()=>parse(adapter.read(key));
 function recover(){
  const pending=adapter.read(journal);
  if(pending==null)return {recovered:false};
  const previous=adapter.read(backup);
  if(previous==null)adapter.remove(key);else {parse(previous);adapter.write(key,previous)}
  adapter.remove(journal);adapter.remove(backup);
  return {recovered:true};
 }
 function save(state,{expectedRaw}={}){
  if(!validateGameStateEnvelope(state).valid)throw Error('Invalid isolated season candidate');
  if(adapter.read(journal)!=null)throw Error('Unresolved isolated transaction journal');
  const before=adapter.read(key);
  if(expectedRaw!==undefined&&before!==expectedRaw)throw Error('Stale isolated season save');
  const next=JSON.stringify(state);
  try{
   if(before!=null)adapter.write(backup,before);else adapter.remove(backup);
   adapter.write(journal,JSON.stringify({version:1,pending:true}));
   adapter.write(key,next);
   adapter.remove(journal);adapter.remove(backup);
   return {saved:true,state};
  }catch(error){
   try{recover()}catch(recoveryError){throw Error('Isolated save failed and requires recovery: '+recoveryError.message)}
   throw error;
  }
 }
 function advance(seed=1,{confirmed=false}={}){
  if(confirmed!==true)throw Error('Explicit experimental save confirmation required');
  if(adapter.read(journal)!=null)throw Error('Recovery required before advancing');
  const before=adapter.read(key);const state=parse(before);
  if(!state)throw Error('No isolated franchise save');
  const result=simulateControlledRosterDay(state,seed,{experimental:true,persist:false});
  if(!result.advanced)return {...result,saved:false};
  save(result.nextState,{expectedRaw:before});
  return {...result,saved:true};
 }
 return Object.freeze({key,load(){if(adapter.read(journal)!=null)throw Error('Recovery required before loading');return read()},save,advance,recover,hasPendingRecovery(){return adapter.read(journal)!=null},productionActivationEnabled:false});
}
module.exports={createIsolatedSeasonStore};
