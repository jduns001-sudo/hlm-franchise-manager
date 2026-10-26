/* Mission 1621: isolated, read-only league standings and completed results. */
'use strict';
(function(root){
function project(state,engine){
 const teams=state?.universe?.teams,games=state?.activity?.games;
 if(!Array.isArray(teams)||!Array.isArray(games)||typeof engine?.calculateStandings!=='function')throw Error('Authoritative standings unavailable');
 const names=new Map(),seen=new Set(),results=[];
 for(const t of teams){if(!t||t.id==null||names.has(String(t.id)))throw Error('Invalid authoritative teams');names.set(String(t.id),String(t.name||t.id))}
 for(const g of games){
  if(!g||g.id==null||seen.has(String(g.id)))throw Error('Invalid or duplicate authoritative game ID');
  seen.add(String(g.id));
  if(!names.has(String(g.homeTeamId))||!names.has(String(g.awayTeamId))||String(g.homeTeamId)===String(g.awayTeamId))throw Error('Invalid authoritative game teams');
  if(!['scheduled','final'].includes(g.status))throw Error('Invalid authoritative game status');
  if(g.status!=='final')continue;
  if(!Number.isSafeInteger(g.homeGoals)||!Number.isSafeInteger(g.awayGoals)||g.homeGoals<0||g.awayGoals<0||g.homeGoals===g.awayGoals||g.overtime!=null&&typeof g.overtime!=='boolean')throw Error('Invalid authoritative final');
  results.push(Object.freeze({id:String(g.id),date:String(g.date||''),home:names.get(String(g.homeTeamId)),away:names.get(String(g.awayTeamId)),homeGoals:g.homeGoals,awayGoals:g.awayGoals,overtime:g.overtime===true}));
 }
 const standings=engine.calculateStandings(teams,games).map(t=>Object.freeze({...t}));
 results.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return Object.freeze({standings:Object.freeze(standings),results:Object.freeze(results)});
}
function mount(doc,readState,engine,host){
 if(!host||!doc||typeof readState!=='function')throw Error('Standings mount unavailable');
 if(doc.getElementById('gm-m1621-standings'))throw Error('Standings already mounted');
 const section=doc.createElement('section');section.id='gm-m1621-standings';
 const h=doc.createElement('h3');h.textContent='Source-backed league standings and results';
 const refresh=doc.createElement('button');refresh.id='gm-m1621-refresh';refresh.type='button';refresh.textContent='Refresh standings (no save)';
 const status=doc.createElement('p');status.id='gm-m1621-status';status.setAttribute('role','status');
 const table=doc.createElement('ol');table.id='gm-m1621-table';
 const results=doc.createElement('ol');results.id='gm-m1621-results';
 section.append(h,refresh,status,table,results);host.after(section);
 let stale=false;
 function clear(message){table.replaceChildren();results.replaceChildren();status.textContent=message}
 function update(){
  if(stale){clear('Another tab changed the franchise. Reload before reviewing standings. No save.');return}
  try{const view=project(readState(),engine);table.replaceChildren();results.replaceChildren();
   for(const row of view.standings){const li=doc.createElement('li');li.dataset.teamId=String(row.teamId);li.textContent=(row.teamName||row.teamId)+' | GP '+row.gp+' W '+row.w+' L '+row.l+' OTL '+row.otl+' GF '+row.gf+' GA '+row.ga+' PTS '+row.points;table.append(li)}
   for(const g of view.results){const li=doc.createElement('li');li.dataset.gameId=g.id;li.textContent=g.date+' | '+g.away+' '+g.awayGoals+' - '+g.homeGoals+' '+g.home+(g.overtime?' | OT':'')+' | '+g.id;results.append(li)}
   status.textContent=view.standings.length+' source teams; '+view.results.length+' authoritative finals. Read-only; no save.';
  }catch(e){clear('Standings unavailable: '+e.message+'. No save.')}
 }
 refresh.addEventListener('click',update);
 root.addEventListener?.('storage',e=>{if(e.key==='hlm-phase11-m1340-isolated-single-game-v1'){stale=true;clear('Another tab changed the franchise. Reload before reviewing standings. No save.')}});
 update();return Object.freeze({section,update});
}
const api=Object.freeze({project,mount});root.HLMSourceStandings=api;
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'&&document.getElementById('gm-m1620-history'))try{
 const manager=root.HLMIsolatedSingleGame.create(root.HLMPhase10,root.localStorage);
 mount(document,()=>{manager.load();return manager.peek()},root.HLMPhase10,document.getElementById('gm-m1620-history'));
}catch(e){root.console?.warn('Experimental standings unavailable:',e.message)}
})(typeof globalThis!=='undefined'?globalThis:this);
