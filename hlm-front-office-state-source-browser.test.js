'use strict';
const assert=require('assert');

const data={hlm_tracker_v3:JSON.stringify({players:[{id:1}],gmSettings:{controlledTeamId:5}}),unrelated:'keep'};
global.localStorage={
  getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
  setItem:(k,v)=>{data[k]=String(v);},
  removeItem:k=>{delete data[k];}
};
const before=JSON.stringify(data);
require('./hlm-front-office-state-source-browser.js');

(async()=>{
  assert(global.HFMFrontOfficeStateSource);
  assert.strictEqual(global.HFMFrontOfficeStateSource.legacyStorageKey,'hlm_tracker_v3');
  const source=global.HFMFrontOfficeStateSource.install();
  assert.strictEqual(source.source,'legacy');
  assert.strictEqual(source.defaultSource,'legacy');
  assert.strictEqual(source.gameStateReadEnabled,false);
  assert.strictEqual(source.automaticGameStateSelectionAllowed,false);
  assert.strictEqual(source.browserStartupCutoverAllowed,false);
  assert.strictEqual(source.frontOfficeActivationAllowed,false);
  assert.strictEqual(source.persistenceWriteAllowed,false);
  assert.strictEqual(source.legacySourceDeletionAllowed,false);
  const snapshot=await source.readSnapshot();
  assert.strictEqual(snapshot.players[0].id,1);
  snapshot.players[0].id=99;
  assert.strictEqual(JSON.parse(data.hlm_tracker_v3).players[0].id,1);
  assert.strictEqual(JSON.stringify(data),before);
  console.log('Front Office deployed state-source browser bridge tests passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
