'use strict';
(function(){
 const by=id=>document.getElementById(id),frame=by('trade-frame');
 const allowed=name=>typeof name==='string'&&/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(name);
 let connected=false,frameReady=false;
 let rosterLoaded=false,rosterLoading=false,rosterEpoch=0,wasPending=false,observer=null,hostOptions=null;
 const status=text=>{by('connection-status').textContent=text};
 function pending(){return frameReady&&frame.contentDocument?.getElementById('outgoing')?.disabled===true}
 function syncPlayers(){
  const busy=pending();
  if(wasPending&&!busy){rosterLoaded=false;by('trade-history').textContent='Refresh saved rosters to verify the latest committed trade history.';by('roster-status').textContent='Settlement finished. Refresh saved rosters before choosing another proposal.'}
  wasPending=busy;
  for(const id of ['outgoing-player','incoming-player'])by(id).disabled=!connected||!rosterLoaded||rosterLoading||busy;
  by('refresh-players').disabled=!connected||rosterLoading||busy;
 }
 function setPlayer(field,value){
  const input=frame.contentDocument.getElementById(field);
  if(!input||input.disabled)return;
  input.value=value;input.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));
 }
 async function loadPlayers(){
  if(!connected||pending()||rosterLoading)return;
  const ticket=++rosterEpoch;rosterLoaded=false;rosterLoading=true;syncPlayers();
  setPlayer('outgoing','');setPlayer('incoming','');
  by('roster-status').textContent='Loading saved rosters…';
  by('trade-history').textContent='Loading saved trade history…';
  try{
   const result=await window.HLMExperimentalTradeHost.listPlayers(hostOptions);
   if(ticket!==rosterEpoch||!connected)return;
   if(!result.ok){by('roster-status').textContent='Roster unavailable: '+result.code;by('trade-history').textContent='Saved trade history unavailable.';return}
   for(const [id,players] of [['outgoing-player',result.outgoing],['incoming-player',result.incoming]]){
    by(id).replaceChildren(new Option('Choose a player',''));
    for(const player of players)by(id).add(new Option(player.label,player.id));
   }
   by('trade-history').textContent=result.history?.ok===true
    ?result.history.entries.length?result.history.entries.map(t=>'Saved revision '+t.revision+' · '+t.id+'\n'+
     t.transfers.map(p=>p.playerName+' ('+p.playerId+'): '+p.fromTeamName+' → '+p.toTeamName+'; annual cap charge '+p.aav.toLocaleString('en-US')).join('\n')).join('\n\n')
     :'No recorded experimental player trades. Older commits without trade details are not reconstructed.'
    :'Saved trade history unavailable.';
   rosterLoaded=true;by('roster-status').textContent='Saved roster revision '+result.revision+'. Choose both players, then review the proposal below.';
  }catch{if(ticket===rosterEpoch){by('roster-status').textContent='Saved rosters could not be loaded.';by('trade-history').textContent='Saved trade history unavailable.';}}
  finally{if(ticket===rosterEpoch){rosterLoading=false;syncPlayers()}}
 }
 by('refresh-players').addEventListener('click',loadPlayers);
 for(const [selector,field] of [['outgoing-player','outgoing'],['incoming-player','incoming']])by(selector).addEventListener('change',()=>{
  if(!connected||!rosterLoaded||pending())return;
  setPlayer(field,by(selector).value);
 });
 function refresh(){by('connect').disabled=connected||!frameReady||!by('authorize').checked||!allowed(by('franchise').value)}
 frame.addEventListener('load',()=>{
  frameReady=true;
  by('trade-history').textContent='Reconnect to view saved trades.';
  rosterEpoch++;rosterLoaded=false;rosterLoading=false;wasPending=false;observer?.disconnect();
  if(connected){connected=false;by('authorize').checked=false;by('authorize').disabled=false;by('franchise').disabled=false;status('Workspace reloaded. Reconnect to review the latest saved revision.')}
  refresh();syncPlayers();
 });
 // Defer may execute after the initial iframe load.
 try{frameReady=frame.contentDocument?.readyState==='complete'&&frame.contentWindow.location.pathname.endsWith('/hlm-phase11-m1524-gm-trade-review.html')}catch{}
 by('authorize').addEventListener('change',refresh);by('franchise').addEventListener('change',refresh);
 by('connect').addEventListener('click',()=>{
  if(connected||!frameReady||!by('authorize').checked||!allowed(by('franchise').value))return;
  if(typeof window.HLMExperimentalTradeHost?.createHost!=='function'){status('Experimental trade host unavailable. Reload to retry.');return}
  hostOptions={
   experimentalEnabled:true,syntheticTestAuthorization:true,realTradeSettlement:false,
   experimentalDatabaseName:by('franchise').value
  };
  frame.contentWindow.HLMTradeReviewHost=window.HLMExperimentalTradeHost.createHost(hostOptions);
  connected=true;by('franchise').disabled=true;by('authorize').disabled=true;refresh();
  status('Connected to the selected isolated test franchise. Review a proposal below; settlement requires your approval.');
  observer?.disconnect();observer=new MutationObserver(syncPlayers);
  observer.observe(frame.contentDocument.documentElement,{subtree:true,attributes:true,attributeFilter:['disabled']});
  loadPlayers();
 });
 (async()=>{
  try{
   if(typeof indexedDB?.databases!=='function')throw Error('database-discovery-unavailable');
   const databases=await indexedDB.databases(),names=[...new Set(databases.map(x=>x.name).filter(allowed))].sort();
   by('franchise').replaceChildren(new Option('Select a franchise',''));
   for(const name of names)by('franchise').add(new Option(name,name));
   by('franchise').disabled=names.length===0;by('authorize').disabled=names.length===0;
   status(names.length?'Disconnected. Select a franchise and enable this test session.':'No existing experimental franchises found. No franchise was created.');
   refresh();
  }catch{status('Existing experimental franchises could not be listed. No franchise was created.')}
 })();
})();
