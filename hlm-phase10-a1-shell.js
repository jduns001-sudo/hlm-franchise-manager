(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.HLMPhase10A1Shell=api;if(new URLSearchParams(root.location?.search||'').get('a22Navigation')==='1')api.mount(root.document)}})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TABS=[{id:'home',label:'Home'},{id:'roster',label:'Team'},{id:'season',label:'Season'},{id:'moves',label:'Moves'},{id:'more',label:'More'}];
const TAB_IDS=TABS.map(t=>t.id);
// Continue Franchise only navigates to the existing control; it never clicks or approves anything.
const ROUTES={
 file:{tab:'more',focus:'new-franchise',label:'Start or import a franchise'},
 'gm-next-decision-review':{tab:'season',focus:'gm-next-decision-review',label:'Review next GM game'},
 'day-review':{tab:'season',focus:'day-review',label:'Review next day'},
 'playoff-start':{tab:'season',focus:'playoff-start',label:'Review playoff qualification'},
 'playoff-next':{tab:'season',focus:'playoff-next',label:'Review next playoff game'},
 'season-id':{tab:'season',focus:'season-id',label:'Confirm championship archive'},
 'offseason-review':{tab:'season',focus:'offseason-review',label:'Review offseason'},
 'season-dashboard':{tab:'season',focus:'season-dashboard',label:'Review season status'}
};
function routeFor(target){return Object.prototype.hasOwnProperty.call(ROUTES,target)?ROUTES[target]:null}
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
+'@media(min-width:900px){#a1-nav{top:0;right:auto;bottom:0;width:224px;flex-direction:column;justify-content:flex-start;gap:4px;padding:16px 8px;border-top:0;border-right:1px solid #6f91b4}#a1-nav button{flex:0 0 auto;border-radius:8px;text-align:left;padding:8px 14px}body.a1-shell{margin:0 auto 0 248px;padding-bottom:18px;max-width:860px}#a1-dashboard dl{grid-template-columns:200px 1fr}}';
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
function fragmentId(hash){try{return decodeURIComponent(String(hash).replace(/^#/,''))}catch{return ''}}
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
 for(const t of TABS){const b=doc.createElement('button');b.type='button';b.dataset.a1Tab=t.id;b.textContent=t.label;b.setAttribute('aria-label',t.label);b.title=t.label;b.dataset.short=({home:'H',roster:'T',season:'S',moves:'⇄',more:'⋯'})[t.id];b.addEventListener('click',()=>{if(t.id==='more')openDrawer();else activate(t.id)});nav.append(b);buttons[t.id]=b}
 body.append(nav);
 const home=doc.getElementById('block-a-dashboard');
 for(const el of [home,doc.getElementById('gm-next-action-heading')].filter(Boolean)){
  el.closest('section')?.classList.add('a1-legacy-dashboard');
 }
 const dash=doc.createElement('section');dash.id='a1-dashboard';dash.setAttribute('aria-labelledby','a1-dashboard-title');
 dash.innerHTML='<h2 id="a1-dashboard-title">Franchise Hub</h2><p id="a1-dashboard-empty" role="status" aria-live="polite"></p><dl id="a1-dashboard-rows"></dl><h3>GM daily decision brief</h3><pre id="a1-home-brief" role="status" aria-live="polite">No isolated season loaded.</pre><p><a href="#gm-daily-brief">Open the full brief in Season</a></p><button id="a1-continue" type="button">Continue Franchise</button><p id="a1-continue-status" role="status" aria-live="polite">Continue only takes you to the next decision. Every save still needs your explicit approval.</p>';
 if(home)home.before(dash);else body.insertBefore(dash,nav);
 items.push([dash,'home']);
 const P=globalThis.HLMPhase10A1Presentation;
 function element(tag,text,attrs={}){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n}
 const extraStyle=element('style',`:root{--a1-page:#101d2c;--a1-nav:#0d1826;--a1-surface:#162b42;--a1-raised:#203b57;--a1-text:#f0f5ff;--a1-secondary:#d7e6f8;--a1-border:#6f91b4;--a1-active:#305477;--a1-accent:#ffda78}body.a1-shell{font:16px system-ui;background:var(--a1-page);color:var(--a1-text)}.a1-panel{background:var(--a1-surface);padding:16px;border:1px solid var(--a1-border);border-radius:12px;margin:12px 0;min-width:0}.a1-panel input,.a1-panel select,.a1-panel button,#a1-drawer button,#a1-sidebar-toggle{min-height:44px;min-width:44px;font:inherit}.a1-panel button,#a1-drawer button{color:var(--a1-text);background:var(--a1-raised);border:1px solid var(--a1-border);border-radius:8px;padding:8px 12px}.a1-panel :focus-visible,#a1-drawer :focus-visible,#a1-sidebar-toggle:focus-visible{outline:3px solid var(--a1-accent);outline-offset:2px}.a1-toolbar{display:flex;gap:8px;flex-wrap:wrap}.a1-toolbar>*{flex:1;min-width:0}.a1-player-card{padding:12px;border:1px solid var(--a1-border);border-radius:8px;margin:8px 0;overflow-wrap:anywhere}.a1-table-wrap{overflow-x:auto;max-width:100%}.a1-roster-table{width:100%;border-collapse:collapse}.a1-roster-table th,.a1-roster-table td{text-align:left;padding:8px;border-bottom:1px solid var(--a1-border)}.a1-roster-table th button{width:100%}#a1-player-detail{overflow-wrap:anywhere}#a1-drawer{box-sizing:border-box;color:var(--a1-text);background:var(--a1-surface);border:1px solid var(--a1-border);border-radius:12px;width:min(92vw,420px);max-height:85dvh;padding:16px}#a1-drawer::backdrop{background:rgb(0 0 0 / .65)}#a1-drawer nav{display:grid;gap:8px}#a1-drawer button[aria-current]{background:var(--a1-active);border-color:var(--a1-accent)}#a1-sidebar-toggle{display:none}.a1-desktop-roster{display:none}.a1-muted{color:var(--a1-secondary)}@media(min-width:900px){#a1-sidebar-toggle{display:block;position:fixed;left:8px;bottom:16px;z-index:35;width:208px;color:var(--a1-text);background:var(--a1-raised);border:1px solid var(--a1-border);border-radius:8px}body.a1-collapsed #a1-nav{width:64px;padding:16px 4px;box-sizing:border-box}body.a1-collapsed{margin-left:88px}body.a1-collapsed #a1-nav button{font-size:0;text-align:center;padding:8px}body.a1-collapsed #a1-nav button:before{content:attr(data-short);font-size:16px}body.a1-collapsed #a1-sidebar-toggle{width:48px;font-size:0}body.a1-collapsed #a1-sidebar-toggle:before{content:'›';font-size:24px}.a1-desktop-roster{display:block}.a1-mobile-roster{display:none}#a1-nav{box-sizing:border-box;width:224px}}@media(prefers-reduced-motion:reduce){body.a1-shell *,#a1-drawer{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`);
 doc.head.append(extraStyle);
 const toggle=element('button','Collapse sidebar',{id:'a1-sidebar-toggle',type:'button','aria-expanded':'true','aria-controls':'a1-nav',title:'Collapse sidebar'});body.append(toggle);toggle.addEventListener('click',()=>{const collapsed=body.classList.toggle('a1-collapsed');toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');toggle.title=collapsed?'Expand sidebar':'Collapse sidebar';toggle.textContent=toggle.title});
 const drawer=element('dialog',undefined,{id:'a1-drawer','aria-labelledby':'a1-drawer-title'});drawer.append(element('h2','More destinations',{id:'a1-drawer-title'}));const close=element('button','Close menu',{type:'button'}),drawerNav=element('nav',undefined,{'aria-label':'More destinations'});drawer.append(close,drawerNav);body.append(drawer);buttons.more.setAttribute('aria-haspopup','dialog');buttons.more.setAttribute('aria-controls','a1-drawer');buttons.more.setAttribute('aria-expanded','false');
 function openDrawer(){if(buttons.more.disabled||drawer.open)return;drawerNav.replaceChildren();for(const [id,tab,label]of [['a1-dashboard','home','Franchise Hub'],['a1-roster','roster','Roster Management'],['a1-saved-plan','roster','Saved plans / Lines & Depth'],...Object.values(ROUTES).map(r=>[r.focus,r.tab,r.label])]){const target=doc.getElementById(id);if(!target)continue;const b=element('button',label,{type:'button'});b.disabled=target.matches(':disabled');if(id===selectedDestination)b.setAttribute('aria-current','page');b.addEventListener('click',()=>{if(target.matches(':disabled')||!body.contains(target))return;drawer.close('destination');activate(tab,false,id);if(!target.matches('button,input,select,textarea,a'))target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'center'})});drawerNav.append(b)}buttons.more.setAttribute('aria-expanded','true');drawer.showModal();close.focus()}
 close.addEventListener('click',()=>drawer.close());drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close()}});drawer.addEventListener('close',()=>{buttons.more.setAttribute('aria-expanded','false');if(drawer.returnValue!=='destination')buttons.more.focus();drawer.returnValue=''});drawer.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const list=[...drawer.querySelectorAll('button:not(:disabled)')],first=list[0],last=list.at(-1);if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus()}});
 const breakpoint=doc.defaultView.matchMedia('(min-width:900px)');breakpoint.addEventListener('change',()=>{if(!breakpoint.matches&&(doc.activeElement===toggle||doc.activeElement===body))buttons[active]?.focus();if(breakpoint.matches&&drawer.open)drawer.close()});
 const seasonText=element('p','Season: Not recorded',{id:'a1-season'}),availability=element('p','Loading authoritative franchise state…',{id:'a1-availability',role:'status'}),alerts=element('p','',{id:'a1-alerts'});dash.querySelector('h2').after(seasonText,availability,alerts);
 const secondary=element('div',undefined,{class:'a1-toolbar'});for(const [tab,label]of [['roster','Open Team'],['season','Open Season']]){const b=element('button',label,{type:'button'});b.addEventListener('click',()=>activate(tab));secondary.append(b)}dash.append(secondary);
 const roster=element('section',undefined,{id:'a1-roster',class:'a1-panel','aria-labelledby':'a1-roster-heading'});roster.append(element('h2','Roster Management',{id:'a1-roster-heading'}),element('p','Read-only authoritative controlled-team roster.'));
 const toolbar=element('div',undefined,{class:'a1-toolbar'}),search=element('input',undefined,{type:'search','aria-label':'Search saved players by name or ID',placeholder:'Search name or ID'}),position=element('select',undefined,{'aria-label':'Filter saved position'}),sorter=element('select',undefined,{'aria-label':'Sort saved players'});for(const [value,label]of [['name','Name'],['position','Position'],['rating','Rating']])sorter.append(element('option',label,{value}));toolbar.append(search,position,sorter);roster.append(toolbar);const summary=element('p','No isolated roster loaded.',{id:'a1-roster-summary',role:'status'}),cards=element('div',undefined,{class:'a1-mobile-roster'}),tableWrap=element('div',undefined,{class:'a1-desktop-roster a1-table-wrap','aria-label':'Saved roster table',tabindex:'0'}),detailPanel=element('section',undefined,{id:'a1-player-detail',tabindex:'-1','aria-label':'Read-only player details'});roster.append(summary,cards,tableWrap,detailPanel);
 const plans=element('section',undefined,{id:'a1-saved-plan',class:'a1-panel',tabindex:'-1','aria-labelledby':'a1-saved-plan-heading'});plans.append(element('h2','Saved plans / Lines & Depth',{id:'a1-saved-plan-heading'}));dash.after(roster,plans);items.push([roster,'roster'],[plans,'roster']);
 let display=null,direction='asc',selectedId=null;
 function openDetail(player){selectedId=player.id;detailPanel.replaceChildren(element('h3',player.name),element('p','Player ID: '+player.id),element('p','Team: '+player.team+' | '+player.teamId),element('p','Saved position: '+player.position),element('p','Saved rating: '+P.rating(player.rating)),element('p','Read only. This view grants no eligibility or approval.'));detailPanel.focus()}
 function renderRoster(){if(!P)return;const source=display?.players||[],rows=P.sort(P.filter(source,{query:search.value,position:position.value||'all'}),sorter.value,direction);summary.textContent=rows.length+' of '+source.length+' saved players';cards.replaceChildren();const table=element('table',undefined,{class:'a1-roster-table'}),head=element('tr');for(const [key,label]of [['name','Player'],['position','Position'],['rating','Rating']]){const th=element('th',undefined,{scope:'col','aria-sort':sorter.value===key?(direction==='asc'?'ascending':'descending'):'none'}),b=element('button',label,{type:'button','data-sort-key':key});b.addEventListener('click',e=>{const keyboard=e.detail===0;direction=sorter.value===key&&direction==='asc'?'desc':'asc';sorter.value=key;renderRoster();if(keyboard)tableWrap.querySelector('[data-sort-key="'+key+'"]').focus()});th.append(b);head.append(th)}head.append(element('th','Details',{scope:'col'}));const thead=element('thead');thead.append(head);table.append(thead);const tbody=element('tbody');for(const player of rows){const card=element('article',undefined,{class:'a1-player-card'});card.append(element('h3',player.name),element('p','ID '+player.id+' | '+player.team),element('p',player.position+' | Rating '+P.rating(player.rating)));const cb=element('button','View '+player.name,{type:'button'});cb.addEventListener('click',()=>openDetail(player));card.append(cb);cards.append(card);const tr=element('tr');for(const value of [player.name,player.position,P.rating(player.rating)])tr.append(element('td',value));const td=element('td'),b=element('button','View '+player.name,{type:'button'});b.addEventListener('click',()=>openDetail(player));td.append(b);tr.append(td);tbody.append(tr)}table.append(tbody);tableWrap.replaceChildren(table);if(!rows.length)cards.append(element('p','No saved players match these filters.'));if(selectedId&&!source.some(p=>p.id===selectedId)){selectedId=null;detailPanel.replaceChildren(element('p','Selected player is unavailable in this saved roster.'))}}
 search.addEventListener('input',renderRoster);position.addEventListener('change',renderRoster);sorter.addEventListener('change',()=>{direction='asc';renderRoster()});
 function renderDisplay(d){if(!P)return;display=d.displaySnapshot||P.project(null);seasonText.textContent='Season: '+display.season;availability.textContent=display.status==='unavailable'?'Unavailable: controlled franchise identity is not established':d.loaded?'Authoritative saved franchise':'No isolated franchise loaded.';alerts.textContent=display.warnings.join(' · ');const prior=position.value;position.replaceChildren(element('option','All saved positions',{value:'all'}));for(const pos of [...new Set(display.players.map(p=>p.position))].sort())position.append(element('option',pos,{value:pos}));position.value=[...position.options].some(o=>o.value===prior)?prior:'all';renderRoster();plans.replaceChildren(element('h2','Saved plans / Lines & Depth',{id:'a1-saved-plan-heading'}),element('p','Saved line assignments: '+display.lines),element('p','Saved depth order: '+display.depth),element('p','Participation plans are intended selections, not actual participation, line assignments or ice time.'));for(const plan of display.plans){plans.append(element('h3',plan.label),element('p','Game: '+plan.gameId));for(const ref of plan.references)plans.append(element('p',ref.id+' | '+ref.name+(ref.valid?'':' | WARNING: '+(ref.warning||'Invalid reference'))))}if(!display.plans.length)plans.append(element('p','Approved participation plan: Unavailable'));}
 let lastStorage='';function syncStorage(){const status=doc.getElementById('transactional-save-status')?.textContent||'';if(status===lastStorage)return;lastStorage=status;if(/blocked|failed|Reload explicitly/i.test(status)){availability.textContent='Unavailable: '+status;if(drawer.open)drawer.close()}else if(!detail.loaded&&/Loading|Saving/.test(status))availability.textContent='Loading authoritative franchise state…'}
 if(doc.defaultView.MutationObserver)new doc.defaultView.MutationObserver(syncStorage).observe(body,{subtree:true,childList:true,characterData:true});

 let active='home',selectedDestination='a1-dashboard',detail={loaded:false,nextTarget:'file'};
 function activate(tab,quiet,destination){
  if(!TAB_IDS.includes(tab))tab='home';
  active=tab;
  selectedDestination=destination||({home:'a1-dashboard',roster:'a1-roster'})[tab]||null;
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
  renderDisplay(detail);
  const rows=dashboardRows(detail),dl=doc.getElementById('a1-dashboard-rows');
  dl.replaceChildren();
  for(const [k,v] of rows){const dt=doc.createElement('dt');dt.textContent=k;const dd=doc.createElement('dd');dd.textContent=v;dl.append(dt,dd)}
  doc.getElementById('a1-dashboard-empty').textContent=rows.length?'':'No isolated franchise loaded. Production Front Office save is unchanged.';
  const r=routeFor(detail.nextTarget);
  doc.getElementById('a1-continue').textContent='Continue Franchise: '+(r?r.label:'Next decision unavailable');
 }
 // Read-only text copy of the existing brief; calculations stay in the page.
 function syncBrief(){const src=doc.getElementById('gm-daily-brief'),dst=doc.getElementById('a1-home-brief');if(src&&dst)dst.textContent=src.textContent}
 function continueFranchise(){
  const status=doc.getElementById('a1-continue-status');
  const target=detail.nextTarget;
  if(!Object.prototype.hasOwnProperty.call(ROUTES,target)){
   status.textContent='Next decision unavailable: unrecognized franchise action. Nothing was saved or approved.';
   return;
  }
  const r=routeFor(target),el=doc.getElementById(r.focus);
  if(!el||!body.contains(el)){
   status.textContent='Next decision unavailable: destination is missing. Nothing was saved or approved.';
   return;
  }
  if(el.matches(':disabled')){
   status.textContent='Next decision unavailable: review control is disabled. Nothing was saved or approved.';
   return;
  }
  activate(r.tab,false,r.focus);
  if(!el.matches('button,input,select,textarea,a'))el.tabIndex=-1;
  el.focus({preventScroll:true});
  el.scrollIntoView({block:'center'});
  status.textContent='Next decision: '+r.label+'. Nothing was saved or approved.';
 }
 doc.addEventListener('hlm:a1-state',e=>render(e.detail));
 doc.getElementById('a1-continue').addEventListener('click',continueFranchise);
 doc.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.getAttribute('href').length<2)return;
  const target=doc.getElementById(fragmentId(a.getAttribute('href')));const tab=target&&tabOfElement(target);if(tab)activate(tab,false,target.id);
 },true);
 doc.defaultView.addEventListener('hashchange',()=>{const target=doc.getElementById(fragmentId(doc.defaultView.location.hash));const tab=target&&tabOfElement(target);if(tab)activate(tab,false,target.id)});
 const hashTarget=doc.defaultView.location.hash.length>1?doc.getElementById(fragmentId(doc.defaultView.location.hash)):null;
 activate(hashTarget&&tabOfElement(hashTarget)||'home',true,hashTarget?.id);
 syncBrief();
 {const src=doc.getElementById('gm-daily-brief');if(src&&doc.defaultView.MutationObserver)new doc.defaultView.MutationObserver(syncBrief).observe(src,{childList:true,characterData:true,subtree:true})}
 render(detail);
 return {activate,render,get active(){return active}};
}
return {TABS,ROUTES,routeFor,fragmentId,dashboardRows,mount};
});
