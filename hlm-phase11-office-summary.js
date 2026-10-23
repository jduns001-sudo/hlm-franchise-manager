/* Mission 1507B: read-only, source-backed isolated franchise Office projection. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMPhase11OfficeSummary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function project(manager){
 if(!manager||typeof manager.peek!=='function')throw Error('Existing isolated franchise manager required');
 const state=manager.peek();
 if(!state)return Object.freeze({status:'no-franchise',message:'No isolated franchise loaded. Resume franchise to create or import one.'});
 const id=state.meta?.controlledTeamId,teams=state.universe?.teams,games=state.activity?.games;
 if(id==null||!Array.isArray(teams)||!Array.isArray(games))throw Error('Authoritative isolated franchise state unavailable');
 const team=teams.find(t=>String(t.id)===String(id));
 if(!team)throw Error('Controlled team not found in source universe');
 const name=t=>String(t?.name||[t?.city,t?.nickname].filter(Boolean).join(' ')||t?.id||'Unknown team');
 const owned=games.filter(g=>String(g.homeTeamId)===String(id)||String(g.awayTeamId)===String(id));
 const final=owned.filter(g=>g.status==='final');
 let wins=0,losses=0,ties=0;
 for(const g of final){
  if(!Number.isSafeInteger(g.homeGoals)||!Number.isSafeInteger(g.awayGoals)||g.homeGoals<0||g.awayGoals<0)throw Error('Authoritative final score missing');
  const own=String(g.homeTeamId)===String(id)?g.homeGoals:g.awayGoals,other=String(g.homeTeamId)===String(id)?g.awayGoals:g.homeGoals;
  if(own>other)wins++;else if(own<other)losses++;else ties++;
 }
 const scheduled=owned.filter(g=>g.status==='scheduled').sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.id).localeCompare(String(b.id)));
 const next=scheduled[0]||null,opponent=next?teams.find(t=>String(t.id)===String(String(next.homeTeamId)===String(id)?next.awayTeamId:next.homeTeamId)):null;
 if(next&&!opponent)throw Error('Scheduled opponent missing from source universe');
 const goalie=state.extensions?.phase11GmGoaliePlan,skaters=state.extensions?.phase11GmGameDaySkaterApproval;
 const goalieApproved=!!goalie&&String(goalie.teamId)===String(id);
 const skatersApproved=!!next&&!!skaters&&String(skaters.teamId)===String(id)&&String(skaters.gameId)===String(next.id);
 return Object.freeze({status:'ready',teamId:String(id),teamName:name(team),record:Object.freeze({wins,losses,ties,finalGames:final.length}),nextGame:next?Object.freeze({gameId:String(next.id),date:String(next.date),opponent:name(opponent),home:String(next.homeTeamId)===String(id)}):null,readiness:Object.freeze({goalieApproved,gameDaySkatersApproved:skatersApproved,requiresHumanGMReview:!!next&&(!goalieApproved||!skatersApproved)}),source:'isolated-franchise-state',readOnly:true});
}
return {project};
});
