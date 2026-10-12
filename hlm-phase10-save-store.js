'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');

/**
 * Adapter-based save transaction. The adapter must implement read(key)
 * and write(key, serializedState). No implicit browser storage dependency.
 */
function createFranchiseSaveStore(adapter, key='hlm-phase10-save') {
  if (!adapter || typeof adapter.read!=='function' || typeof adapter.write!=='function') {
    throw new TypeError('Save adapter requires read and write methods');
  }
  function load() {
    const raw=adapter.read(key);
    if (raw==null) return null;
    const state=JSON.parse(raw);
    const result=validateGameStateEnvelope(state);
    if (!result.valid) throw new Error('Stored franchise state is invalid');
    return state;
  }
  function save(state) {
    const validation=validateGameStateEnvelope(state);
    if (!validation.valid) throw new Error('Cannot save invalid franchise state');
    const serialized=JSON.stringify(state);
    adapter.write(key,serialized);
    return state;
  }
  function advanceAndSave(seed=0) {
    const current=load();
    if (!current) throw new Error('No saved franchise state');
    const advanced=simulateNextDay(current,seed);
    save(advanced.nextState);
    return advanced;
  }
  return {load,save,advanceAndSave};
}
module.exports={createFranchiseSaveStore};
