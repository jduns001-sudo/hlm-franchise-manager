/* Mission 1620: read-only, source-backed CPU fixture lifecycle projection. */
'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMCPUFixtureHistory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
function project(state){
 const games=state?.activity?.games,teams=state?.universe?.teams,gm=state?.meta?.controlledTeamId;
 if(!Array.isArray(games)||!Array.isArray(teams)||gm==null)throw Error('Authoritative isolated universe unavailable');
 const names=new Map(teams.filter(t=>t&&t.id!=null).map(t=>[String(t.id),String(t.name||t.id)]));
 const seen=new Set(),rows=[];
 for(const g of games){
  if(!g||g.id==null)continue;
  if(String(g.homeTeamId)===String(gm)||String(g.awayTeamId)===String(gm))continue;
  if(g.status!=='scheduled'&&g.status!=='final')continue;
  const id=String(g.id);
  if(seen.has(id))throw Error('Duplicate CPU fixture ID: '+id);
  seen.add(id);
  if(!names.has(String(g.homeTeamId))||!names.has(String(g.awayTeamId)))throw Error('CPU fixture team missing');
  if(g.status==='final'&&(!Number.isSafeInteger(g.homeGoals)||g.homeGoals<0||!Number.isSafeInteger(g.awayGoals)||g.awayGoals<0))throw Error('Invalid authoritative CPU final');
  rows.push(Object.freeze({id,date:String(g.date||''),home:names.get(String(g.homeTeamId)),away:names.get(String(g.awayTeamId)),status:g.status,homeGoals:g.status==='final'?g.homeGoals:null,awayGoals:g.status==='final'?g.awayGoals:null}));
 }
 return Object.freeze(rows.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)));
}
function mount(doc,readState,host){
 if(!doc||typeof readState!=='function'||!host)throw Error('CPU history mount dependencies missing');
 if(doc.getElementById('gm-m1620-history'))throw Error('CPU history already mounted');
 const section=doc.createElement('section');section.id='gm-m1620-history';
 const heading=doc.createElement('h3');heading.textContent='CPU fixture lifecycle history';
 const refresh=doc.createElement('button');refresh.type='button';refresh.id='gm-m1620-refresh';refresh.textContent='Refresh CPU fixture history (no save)';
 const status=doc.createElement('p');status.id='gm-m1620-status';status.setAttribute('role','status');
 const list=doc.createElement('ol');list.id='gm-m1620-list';section.append(heading,refresh,status,list);host.after(section);
 let stale=false;
 function clear(message){list.replaceChildren();status.textContent=message}
 function update(){if(stale){clear('Another tab changed the franchise. Reload the isolated workspace before reviewing. No save.');return}try{const rows=project(readState());list.replaceChildren();for(const f of rows){const li=doc.createElement('li');li.dataset.gameId=f.id;li.textContent=f.date+' | '+f.away+' at '+f.home+' | '+(f.status==='final'?'Final '+f.awayGoals+'-'+f.homeGoals:'Scheduled')+' | '+f.id;list.append(li)}status.textContent=rows.length+' authoritative CPU fixture(s), '+rows.filter(x=>x.status==='final').length+' final. Read-only; no save.'}catch(e){clear('CPU history unavailable: '+e.message+'. No save.')}}
 refresh.addEventListener('click',update);
 root.addEventListener?.('storage',e=>{if(e.key==='hlm-phase11-m1340-isolated-single-game-v1'){stale=true;clear('Another tab changed the franchise. Reload the isolated workspace before reviewing. No save.')}});
 update();return Object.freeze({section,update});
}
return Object.freeze({project,mount});
});
(function(){try{if(typeof document==='undefined'||!document.getElementById('gm-m1607-fixtures'))return;const manager=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);HLMCPUFixtureHistory.mount(document,()=>manager.peek(),document.getElementById('gm-m1607-fixtures'))}catch(e){console.warn('Experimental CPU fixture history unavailable:',e.message)}})();
