(function(root){'use strict';
function createController(storage,{enabled=false,simulationBundle=null,financeApi=null,advanceApi=null}={}){
 if(enabled!==true)throw Error('Explicit Finance Center opt-in required');
 const finance=financeApi||root.HLMPhase11BrowserFinance;
 const advance=advanceApi||root.HLMPhase11BrowserAdvance;
 const bundle=simulationBundle||root.HLMPhase11SimBundle;
 if(!finance||!advance||!bundle||typeof bundle.preview!=='function')throw Error('Deployed Phase 10 simulation bundle and finance modules required');
 const session=finance.create(storage,{enabled:true});
 const simulator=advance.create(storage,{enabled:true,engine:bundle});
 let candidate=null;
 function preview(seed,policy){const state=session.load();if(!state)throw Error('Import isolated GameState first');const ids=state.universe.teams.map(t=>t.id);if(!ids.length)throw Error('No teams in GameState');const policies=Object.fromEntries(ids.map(id=>[String(id),policy]));candidate=simulator.preview(seed,ids,policies);return {fromDate:candidate.fromDate,toDate:candidate.toDate,gameResults:candidate.results,finances:candidate.nextState.finances}}
 function confirm({confirmed=false}={}){if(!candidate)throw Error('Preview a day before committing');const c=candidate;candidate=null;return simulator.commit(c,{confirmed})}
 return Object.freeze({preview,confirm,load:()=>session.load(),importState:(state,options)=>{candidate=null;return session.importState(state,options)},finance:(id,policy)=>session.derive(id,policy),previewSigning:(id,policy,salary)=>session.previewSigning(id,policy,salary)});
}
root.HLMPhase11FinanceGameplayController={createController};
if(typeof module!=='undefined'&&module.exports)module.exports=root.HLMPhase11FinanceGameplayController;
})(typeof globalThis!=='undefined'?globalThis:this);
