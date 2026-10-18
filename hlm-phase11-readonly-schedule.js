/* Session-only schedule preview. No production save, storage, or simulation writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMReadOnlySchedule=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function parse(value,controlledTeamId){
 if(controlledTeamId==null)throw Error('Select a controlled team before importing a schedule');
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid GameState JSON');
 const games=value.activity?.games;
 if(!Array.isArray(games))throw Error('Export has no activity.games schedule; no games were generated');
 if(games.length>5000)throw Error('Schedule exceeds safe preview limit');
 const teams=value.universe?.teams;
 if(!Array.isArray(teams)||!teams.some(t=>t&&String(t.id)===String(controlledTeamId)))throw Error('Controlled team is absent from imported GameState');
 const seen=new Set();
 const rows=games.map(g=>{
  if(!g||typeof g!=='object'||g.id==null||seen.has(String(g.id)))throw Error('Invalid or duplicate game ID');
  seen.add(String(g.id));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(g.date))||!Number.isFinite(Date.parse(g.date+'T00:00:00Z')))throw Error('Invalid game date');
  if(g.homeTeamId==null||g.awayTeamId==null||String(g.homeTeamId)===String(g.awayTeamId))throw Error('Invalid game teams');
  if(!teams.some(t=>t&&String(t.id)===String(g.homeTeamId))||!teams.some(t=>t&&String(t.id)===String(g.awayTeamId)))throw Error('Game references unknown team');
  return {id:String(g.id),date:String(g.date),homeTeamId:String(g.homeTeamId),awayTeamId:String(g.awayTeamId),status:String(g.status||'unknown')};
 });
 return Object.freeze({source:'imported GameState JSON (read-only session)',controlledTeamId:String(controlledTeamId),totalGames:rows.length,teamGames:rows.filter(g=>g.homeTeamId===String(controlledTeamId)||g.awayTeamId===String(controlledTeamId)).sort((a,b)=>a.date.localeCompare(b.date)),productionWrites:false,generatedGames:false});
}
return {parse};
});
