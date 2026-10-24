'use strict';
(function(){
 const by=id=>document.getElementById(id),frame=by('trade-frame');
 const allowed=name=>typeof name==='string'&&/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(name);
 let connected=false,frameReady=false;
 const status=text=>{by('connection-status').textContent=text};
 function refresh(){by('connect').disabled=connected||!frameReady||!by('authorize').checked||!allowed(by('franchise').value)}
 frame.addEventListener('load',()=>{
  frameReady=true;
  if(connected){connected=false;by('authorize').checked=false;by('authorize').disabled=false;by('franchise').disabled=false;status('Workspace reloaded. Reconnect to review the latest saved revision.')}
  refresh();
 });
 // Defer may execute after the initial iframe load.
 try{frameReady=frame.contentDocument?.readyState==='complete'&&frame.contentWindow.location.pathname.endsWith('/hlm-phase11-m1524-gm-trade-review.html')}catch{}
 by('authorize').addEventListener('change',refresh);by('franchise').addEventListener('change',refresh);
 by('connect').addEventListener('click',()=>{
  if(connected||!frameReady||!by('authorize').checked||!allowed(by('franchise').value))return;
  if(typeof window.HLMExperimentalTradeHost?.createHost!=='function'){status('Experimental trade host unavailable. Reload to retry.');return}
  frame.contentWindow.HLMTradeReviewHost=window.HLMExperimentalTradeHost.createHost({
   experimentalEnabled:true,syntheticTestAuthorization:true,realTradeSettlement:false,
   experimentalDatabaseName:by('franchise').value
  });
  connected=true;by('franchise').disabled=true;by('authorize').disabled=true;refresh();
  status('Connected to the selected isolated test franchise. Review a proposal below; settlement requires your approval.');
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
