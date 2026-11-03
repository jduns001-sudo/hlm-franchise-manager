(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.HLMPhase10A1Shell=api;api.mount(root.document)}})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TABS=[{id:'home',label:'Home'},{id:'roster',label:'Team'},{id:'season',label:'Season'},{id:'moves',label:'Moves'},{id:'more',label:'More'}];
const TAB_IDS=TABS.map(t=>t.id);
// Continue Franchise only navigates to the existing control; it never clicks or approves anything.
const ROUTES={
 file:{tab:'more',focus:'new-franchise',label:'Start or import a franchise'},
 'day-review':{tab:'season',focus:'day-review',label:'Review next day'},
 'playoff-start':{tab:'season',focus:'playoff-start',label:'Review playoff qualification'},
 'playoff-next':{tab:'season',focus:'playoff-next',label:'Review next playoff game'},
 'season-id':{tab:'season',focus:'season-id',label:'Confirm championship archive'},
 'offseason-review':{tab:'season',focus:'offseason-review',label:'Review offseason'},
 'season-dashboard':{tab:'season',focus:'season-dashboard',label:'Review season status'}
};
function routeFor(target){return ROUTES[target]||ROUTES['season-dashboard']}
function dashboardRows(d){
 if(!d||d.loaded!==true)return [];
 const s=d.standing;
 const rows=[['Team',d.teamName],['Date',d.date]];
 if(s)rows.push(['Record',s.w+'-'+s.l+'-'+s.otl+' | '+s.points+' pts | GP '+s.gp]);
 rows.push(['Roster players',String(d.players)],['Draft rights',String(d.draftRights)],
  ['Team games',d.ownerFinals+' completed | '+d.ownerRemaining+' remaining'],
  ['Next game',d.nextGame?d.nextGame.date+' | '+d.nextGame.home+' vs '+d.nextGame.away:'None'],
  ['Latest result',d.lastResult||'None'],['Recent form',d.form||'None']);
 if(d.playoffStatus)rows.push(['Playoffs',d.playoffStatus]);
 rows.push(['Roster-aware scores',d.experimentalScores===true?'GM enabled (experimental, nonofficial)':'Off by default']);
 return rows;
}
const CSS='.a1-off{display:none!important}'
+' .a1-legacy-dashboard{display:none!important}'
+'#a1-nav{position:fixed;z-index:30;left:0;right:0;bottom:0;display:flex;background:#0d1826;border-top:1px solid #6f91b4;padding-bottom:env(safe-area-inset-bottom)}'
+'#a1-nav button{flex:1 1 0;margin:0;min-height:56px;padding:6px 2px;border:0;border-radius:0;background:transparent;color:#d7e6f8;font-weight:650}'
+'#a1-nav button[aria-current="page"]{background:#305477;color:#fff;box-shadow:inset 0 3px 0 #ffda78}'
+'body.a1-shell{padding-bottom:84px}'
+'body.a1-shell label,body.a1-shell select,body.a1-shell input,body.a1-shell textarea,body.a1-shell button{max-width:100%;box-sizing:border-box}body.a1-shell label{display:block}body.a1-shell select{width:100%}'
+'#a1-dashboard dl{display:grid;grid-template-columns:1fr;gap:4px;margin:8px 0}#a1-dashboard dt{font-weight:650;color:#a9d6ff}#a1-dashboard dd{margin:0 0 6px}'
+'#a1-continue{width:100%;margin:8px 0;font-weight:750;background:#ffda78;color:#101d2c;border:0;border-radius:10px;min-height:52px}'
+'@media(min-width:900px){#a1-nav{top:0;right:auto;bottom:0;width:180px;flex-direction:column;justify-content:flex-start;gap:4px;padding:16px 8px;border-top:0;border-right:1px solid #6f91b4}#a1-nav button{flex:0 0 auto;border-radius:8px;text-align:left;padding:8px 14px}body.a1-shell{margin:0 auto 0 200px;padding-bottom:18px;max-width:860px}#a1-dashboard dl{grid-template-columns:200px 1fr}}';
const HEADING_TAB=[['New Franchise','more'],['Import isolated','more'],['Saved isolated','season'],['GM-reviewed future pick','moves'],['GM draft selection','moves'],['Sign owned','moves'],['GM signing transaction','moves'],['Controlled team roster','roster'],['Experimental GM player','roster'],['Season dashboard:','season']];
const ID_TAB={'block-a-navigation':'more','season-entry-safety':'all','block-a-dashboard':'home','gm-next-action-heading':'home','gm-goalie-choice':'roster','approve':'season','gm-postgame-game':'season'};
function keyTab(el){
 const ids=[el.id,el.querySelector&&el.querySelector('[id]')&&el.querySelector('[id]').id].filter(Boolean);
 for(const id of ids)if(ID_TAB[id])return ID_TAB[id];
 const text=/^H[1-6]$/.test(el.tagName)||el.tagName==='SECTION'&&el.firstElementChild&&/^H[23]$/.test(el.firstElementChild.tagName)?(el.tagName==='SECTION'?el.firstElementChild:el).textContent.trim():'';
 for(const [prefix,tab] of HEADING_TAB)if(text.startsWith(prefix))return tab;
 return null;
}
function assign(list,start){let current=start;return list.map(el=>{const t=keyTab(el);if(t)current=t;return [el,current]})}
function mount(doc){
 if(!doc||!doc.body||doc.getElementById('a1-nav'))return null;
 const body=doc.body;body.classList.add('a1-shell');
 for(const a of body.querySelectorAll('a[href="#gm-next-action-heading"]'))a.href='#a1-dashboard';
 const style=doc.createElement('style');style.id='a1-shell-style';style.textContent=CSS;doc.head.append(style);
 const items=[];
 const top=Array.from(body.children).filter(el=>!['SCRIPT','STYLE'].includes(el.tagName));
 for(const [el,tab] of assign(top,'all')){
  if(el.tagName==='H1')items.push([el,'all']);
  else if(el.tagName==='SECTION'&&el.querySelector(':scope > h2')&&el.querySelector(':scope > h2').textContent.trim().startsWith('Saved isolated')){
   const kids=Array.from(el.children),inner=assign(kids,'season');
   inner.forEach(([k,t])=>items.push([k,t,el]));
  }else items.push([el,tab]);
 }
 // Container sections of split content are hidden when none of their children are shown.
 const containers=Array.from(new Set(items.filter(i=>i[2]).map(i=>i[2])));
 const nav=doc.createElement('nav');nav.id='a1-nav';nav.setAttribute('aria-label','Primary navigation');
 const buttons={};
 for(const t of TABS){const b=doc.createElement('button');b.type='button';b.dataset.a1Tab=t.id;b.textContent=t.label;b.addEventListener('click',()=>activate(t.id));nav.append(b);buttons[t.id]=b}
 body.append(nav);
 const home=doc.getElementById('block-a-dashboard');
 for(const el of [home,doc.getElementById('gm-next-action-heading')].filter(Boolean)){
  el.closest('section')?.classList.add('a1-legacy-dashboard');
 }
 const dash=doc.createElement('section');dash.id='a1-dashboard';dash.setAttribute('aria-labelledby','a1-dashboard-title');
 dash.innerHTML='<h2 id="a1-dashboard-title">Dashboard</h2><p id="a1-dashboard-empty" role="status" aria-live="polite"></p><dl id="a1-dashboard-rows"></dl><h3>GM daily decision brief</h3><pre id="a1-home-brief" role="status" aria-live="polite">No isolated season loaded.</pre><p><a href="#gm-daily-brief">Open the full brief in Season</a></p><button id="a1-continue" type="button">Continue Franchise</button><p id="a1-continue-status" role="status" aria-live="polite">Continue only takes you to the next decision. Every save still needs your explicit approval.</p>';
 if(home)home.before(dash);else body.insertBefore(dash,nav);
 items.push([dash,'home']);
 let active='home',detail={loaded:false,nextTarget:'file'};
 function activate(tab,quiet){
  if(!TAB_IDS.includes(tab))tab='home';
  active=tab;
  for(const [el,t] of items)el.classList.toggle('a1-off',t!=='all'&&t!==tab);
  for(const c of containers)c.classList.toggle('a1-off',!items.some(i=>i[2]===c&&!i[0].classList.contains('a1-off')));
  for(const id of TAB_IDS){if(id===tab)buttons[id].setAttribute('aria-current','page');else buttons[id].removeAttribute('aria-current')}
 }
 function tabOfElement(el){
  let node=el;
  while(node&&node!==body){const hit=items.find(i=>i[0]===node);if(hit)return hit[1]==='all'?null:hit[1];node=node.parentElement}
  return null;
 }
 function render(d){
  detail=d||detail;
  syncBrief();
  const rows=dashboardRows(detail),dl=doc.getElementById('a1-dashboard-rows');
  dl.replaceChildren();
  for(const [k,v] of rows){const dt=doc.createElement('dt');dt.textContent=k;const dd=doc.createElement('dd');dd.textContent=v;dl.append(dt,dd)}
  doc.getElementById('a1-dashboard-empty').textContent=rows.length?'':'No isolated franchise loaded. Production Front Office save is unchanged.';
  refreshContinue();
 }
 // Resolve the real destination once for both presentation and navigation.
 function destination(){
  const target=detail.nextTarget;
  if(!Object.prototype.hasOwnProperty.call(ROUTES,target))return {reason:'unrecognized franchise action'};
  const route=ROUTES[target],el=doc.getElementById(route.focus);
  if(!el||!body.contains(el))return {route,reason:'destination is missing'};
  if(el.matches(':disabled'))return {route,reason:'review control is disabled'};
  return {route,el};
 }
 function refreshContinue(){
  const result=destination(),button=doc.getElementById('a1-continue'),status=doc.getElementById('a1-continue-status');
  const label=result.route?result.route.label:'Unrecognized action';
  const title='Continue Franchise: '+(result.reason?'Unavailable ('+label+')':label);
  const message=result.reason?'Next decision unavailable: '+result.reason+'. Nothing was saved or approved.':'Next decision ready: '+label+'. Continue only navigates; explicit GM approval is still required.';
  if(button.textContent!==title)button.textContent=title;
  if(status.textContent!==message)status.textContent=message;
 }
 // Read-only text copy of the existing brief; calculations stay in the page.
 function syncBrief(){const src=doc.getElementById('gm-daily-brief'),dst=doc.getElementById('a1-home-brief');if(src&&dst)dst.textContent=src.textContent}
 function continueFranchise(){
  const result=destination();
  if(result.reason){refreshContinue();return}
  const r=result.route,el=result.el;
  activate(r.tab);
  if(!el.matches('button,input,select,textarea,a'))el.tabIndex=-1;
  el.focus({preventScroll:true});
  el.scrollIntoView({block:'center'});
  doc.getElementById('a1-continue-status').textContent='Next decision: '+r.label+'. Nothing was saved or approved.';
 }
 doc.addEventListener('hlm:a1-state',e=>render(e.detail));
 // Only reflect availability changes; do not activate controls or modify game state.
 if(doc.defaultView.MutationObserver)new doc.defaultView.MutationObserver(changes=>{
  if(changes.some(change=>!dash.contains(change.target)))refreshContinue();
 }).observe(body,{subtree:true,attributes:true,attributeFilter:['disabled','id'],childList:true});
 doc.getElementById('a1-continue').addEventListener('click',continueFranchise);
 doc.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.getAttribute('href').length<2)return;
  const target=doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));const tab=target&&tabOfElement(target);if(tab)activate(tab);
 },true);
 doc.defaultView.addEventListener('hashchange',()=>{const target=doc.getElementById(decodeURIComponent(doc.defaultView.location.hash.slice(1)));const tab=target&&tabOfElement(target);if(tab)activate(tab)});
 const hashTarget=doc.defaultView.location.hash.length>1?doc.getElementById(decodeURIComponent(doc.defaultView.location.hash.slice(1))):null;
 activate(hashTarget&&tabOfElement(hashTarget)||'home',true);
 syncBrief();
 {const src=doc.getElementById('gm-daily-brief');if(src&&doc.defaultView.MutationObserver)new doc.defaultView.MutationObserver(syncBrief).observe(src,{childList:true,characterData:true,subtree:true})}
 render(detail);
 return {activate,render,get active(){return active}};
}
return {TABS,ROUTES,routeFor,dashboardRows,mount};
});
