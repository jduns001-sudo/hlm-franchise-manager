/* M1579: next-action launcher delegates to existing GM review controls only.
 * Never invokes approve/save. Fresh saved-state snapshot required at click.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMUnifiedGMNextAction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const map=Object.freeze({
 'day-review':'day-review',
 'playoff-start':null,
 'playoff-next':null,
 'season-id':null,
 'offseason-review':'offseason-review',
 'file':null,
 'season-dashboard':null
});
function create(readState,readCurrentTarget){
 if(typeof readState!=='function')throw Error('Saved franchise reader required');
 if(readCurrentTarget!==undefined&&typeof readCurrentTarget!=='function')throw Error('Current action reader must be a function');
 let snapshot=null,target=null;
 return Object.freeze({
  prepare(fragment){
   const selected=String(fragment||'').replace(/^#/,'');
   snapshot=null;target=null;
   const state=readState();
   if(!state||!Array.isArray(state.activity?.games))return Object.freeze({available:false,reason:'Load saved isolated franchise first',saved:false});
   if(!Object.prototype.hasOwnProperty.call(map,selected)||!map[selected])
    return Object.freeze({available:false,reason:'This next action has no safe review handoff',saved:false});
   if(selected==='day-review'&&!state.activity.games.some(g=>g.status==='scheduled'))
    return Object.freeze({available:false,reason:'No scheduled day to review',saved:false});
   snapshot=JSON.stringify(state);target=map[selected];
   return Object.freeze({available:true,target,saved:false});
  },
  open(){
   if(snapshot===null||!target)throw Error('Refresh current GM action first');
   const current=readState();
   if(!current||JSON.stringify(current)!==snapshot){snapshot=null;target=null;throw Error('Saved season changed; refresh GM next action');}
   if(readCurrentTarget&&String(readCurrentTarget()).replace(/^#/,'')!==target){snapshot=null;target=null;throw Error('GM next action changed; refresh before reviewing');}
   if(target==='day-review'&&!current.activity.games.some(g=>g.status==='scheduled')){snapshot=null;target=null;throw Error('No scheduled GM day remains');}
   const chosen=target;target=null;snapshot=null;
   return Object.freeze({target:chosen,saved:false,requiresExplicitGMApproval:true});
  },
  cancel(){snapshot=null;target=null;return Object.freeze({saved:false,declined:true})}
 });
}
return Object.freeze({create});
});
