/* M1579: link current GM action to existing review without authorizing a save. */
'use strict';(function(){
const $=id=>document.getElementById(id),open=$('gm-unified-action-open'),cancel=$('gm-unified-action-decline'),status=$('gm-unified-action-status'),link=$('gm-next-action-link');
if(!open||!cancel||!status||!link)return;
const manager=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage);
const gate=window.HLMUnifiedGMNextAction.create(()=>manager.peek(),()=>link.getAttribute('href'));
function reset(text){gate.cancel();status.textContent=text;open.disabled=true;cancel.disabled=true;}
function refresh(){
 const review=gate.prepare(link.getAttribute('href'));
 open.disabled=!review.available;cancel.disabled=!review.available;
 status.textContent=review.available?'Next GM action ready for review (no save): '+review.target+'. Explicit GM approval remains required.':review.reason+'. Existing controls remain available.';
}
open.addEventListener('click',()=>{
 try{const action=gate.open(),target=$(action.target);if(!target||target.disabled)throw Error('GM review unavailable; refresh current franchise');
 target.click();target.focus();status.textContent='Existing GM review opened. No action approved or saved. Confirm only through the existing guarded controls.';
 open.disabled=true;cancel.disabled=true;
 }catch(e){reset('Next GM review blocked: '+e.message+'. No save performed.');}
});
cancel.addEventListener('click',()=>reset('Next GM action review declined. No changes saved.'));
$('season-trade-refresh')?.addEventListener('click',refresh);
const output=$('output');if(output)new MutationObserver(refresh).observe(output,{childList:true,subtree:true,characterData:true});
new MutationObserver(()=>{reset('Current GM action changed. No save performed.');refresh()}).observe(link,{attributes:true,attributeFilter:['href']});
window.addEventListener('storage',e=>{if(e.key===manager.key)reset('Saved franchise changed in another tab. Refresh next GM action. No save performed.')});
refresh();
})();