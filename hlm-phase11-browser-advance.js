(function(root){'use strict';
const KEY='hlm-phase11-finance-browser-preview-v1';
function create(storage,{enabled=false,engine=null}={}){
 if(enabled!==true)throw Error('Explicit browser finance simulation opt-in required');
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Storage required');
 function preview(seed,teamIds,policies){
  if(!engine||typeof engine.preview!=='function')throw Error('Actual Phase 10 simulation bundle not loaded');
  const raw=storage.getItem(KEY);if(!raw)throw Error('Import isolated franchise first');
  const before=JSON.parse(raw);
  const outcome=engine.preview(before,seed,teamIds,policies);
  if(!outcome||!outcome.nextState||outcome.nextState.meta.currentDate===before.meta.currentDate)throw Error('Invalid simulation result');
  return Object.freeze({fromDate:outcome.fromDate,toDate:outcome.toDate,results:outcome.results,nextState:outcome.nextState,expectedRaw:raw});
 }
 function commit(candidate,{confirmed=false}={}){
  if(confirmed!==true)throw Error('Explicit simulation confirmation required');
  if(!candidate||typeof candidate.expectedRaw!=='string'||!candidate.nextState)throw Error('Invalid preview candidate');
  if(storage.getItem(KEY)!==candidate.expectedRaw)throw Error('Isolated save changed since preview; retry');
  storage.setItem(KEY,JSON.stringify(candidate.nextState));
  return candidate.nextState;
 }
 return Object.freeze({preview,commit,key:KEY});
}
root.HLMPhase11BrowserAdvance={create,key:KEY};
if(typeof module!=='undefined'&&module.exports)module.exports=root.HLMPhase11BrowserAdvance;
})(typeof globalThis!=='undefined'?globalThis:this);
