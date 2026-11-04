/* UX-02A: read-only, original mobile visual system. Never writes franchise state. */
(function(root){
'use strict';
const CSS=`
:root{--hlm-ink:#142b3e;--hlm-gold:#f3cb6a;--hlm-card:#f5f7fa;--hlm-text:#17283a}
.hlm-visual{color:var(--hlm-text);background:#fff;border-radius:16px;overflow:hidden;margin:14px 0;font:16px system-ui,sans-serif}
.hlm-visual *{box-sizing:border-box}
.hlm-visual + #gm-roster{display:none!important}
.hlm-visual__header{background:var(--hlm-ink);color:white;padding:18px}
.hlm-visual__header h2{margin:0;color:white}
.hlm-visual__content{padding:12px}
.hlm-visual__tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:8px 0 14px}
.hlm-visual__tabs button{min-width:0;margin:0;border:0;border-radius:8px;background:#edf1f5;color:var(--hlm-text);font-size:13px;padding:10px 2px}
.hlm-visual__tabs button[aria-selected="true"]{background:var(--hlm-ink);color:white}
.hlm-visual__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.hlm-visual__grid[data-cols="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}
.hlm-visual__grid[data-cols="1"]{grid-template-columns:1fr}
.hlm-visual__label{background:var(--hlm-ink);color:#fff;text-align:center;padding:9px 2px;font-weight:700;font-size:13px}
.hlm-visual__player{min-width:0;min-height:76px;background:var(--hlm-card);border:1px solid #e1e6eb;border-radius:9px;padding:9px 6px;color:var(--hlm-text);text-align:left;margin:0;width:100%;display:flex;flex-direction:column;justify-content:center;gap:5px}
.hlm-visual__player strong{font-size:13px;overflow-wrap:anywhere;line-height:1.2}
.hlm-visual__meta{font-size:12px;color:#4a5c6c}
.hlm-visual__rating{background:#55c765;color:#102418;padding:2px 5px;border-radius:4px;font-weight:750}
.hlm-visual__note{font-size:13px;color:#4a5c6c;line-height:1.4;margin:12px 0}
.hlm-visual__detail{border:1px solid #cbd6e0;border-radius:9px;padding:12px;margin-top:12px}
.hlm-visual__detail h3{color:var(--hlm-text);margin:0 0 8px}
.hlm-visual__empty{padding:16px;background:var(--hlm-card);border-radius:8px}
.hlm-visual button:focus-visible{outline:3px solid #b06b08;outline-offset:2px}
`;
const CATEGORIES=['Offense','Defense','Goalies','Units'];
const POSITION_GROUPS={Offense:['LW','C','RW'],Defense:['LD','RD'],Goalies:['G']};
function group(position){
 const p=String(position||'').toUpperCase().replace(/\s/g,'');
 if(p==='G'||p==='GK'||p==='GOALIE')return 'G';
 if(p==='LD'||p==='RD')return p;
 if(p==='D')return 'LD';
 if(p==='LW'||p==='RW'||p==='C')return p;
 if(p==='F')return 'C';
 return null;
}
function cleanPlayer(p){
 if(!p||typeof p!=='object')return null;
 const name=String(p.name||'').trim();
 if(!name)return null;
 const rating=p.overall??p.ovr;
 return {name,position:String(p.position||'').trim(),rating:typeof rating==='number'&&Number.isFinite(rating)?rating:null, id:String(p.id??'')};
}
function make(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=text;return e}
function mount(doc){
 if(!doc||doc.getElementById('hlm-visual-lineup'))return;
 const anchor=doc.getElementById('gm-roster');if(!anchor)return;
 const style=doc.createElement('style');style.id='hlm-visual-style';style.textContent=CSS;doc.head.append(style);
 const root=doc.createElement('section');root.id='hlm-visual-lineup';root.className='hlm-visual';root.setAttribute('aria-label','Visual lineup');
 const header=make('header','hlm-visual__header');header.append(make('h2','', 'Lineup'),make('p','','No franchise loaded'));
 const content=make('div','hlm-visual__content'),tabs=make('div','hlm-visual__tabs'),view=make('div',''),detail=make('div','hlm-visual__detail');
 tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Lineup categories');
 content.append(tabs,view,detail);root.append(header,content);
 anchor.before(root);
 let state={loaded:false,teamName:'',roster:[]},active='Offense';
 function draw(){
  header.querySelector('p').textContent=state.loaded?state.teamName+' • '+state.roster.length+' roster players':'Create or load a franchise to see your roster';
  tabs.replaceChildren();
  for(const label of CATEGORIES){const b=make('button','',label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(label===active));b.addEventListener('click',()=>{active=label;draw()});tabs.append(b)}
  view.replaceChildren();detail.replaceChildren();detail.hidden=true;
  if(!state.loaded){view.append(make('p','hlm-visual__empty','No franchise loaded. Your existing franchise remains unchanged.'));return}
  if(active==='Units'){view.append(make('p','hlm-visual__empty','Special-team assignments are not available in this verified roster data. No units have been invented.'));return}
  const columns=POSITION_GROUPS[active],buckets=columns.map(c=>state.roster.filter(p=>group(p.position)===c).sort((a,b)=>a.name.localeCompare(b.name)));
  const grid=make('div','hlm-visual__grid');grid.dataset.cols=String(columns.length);
  for(const c of columns)grid.append(make('div','hlm-visual__label',c));
  const rows=Math.max(1,...buckets.map(b=>b.length));
  for(let r=0;r<rows;r++)for(let c=0;c<columns.length;c++){
   const p=buckets[c][r];
   if(!p){grid.append(make('div','hlm-visual__player',''));continue}
   const b=make('button','hlm-visual__player');b.type='button';
   b.append(make('strong','',p.name));
   const meta=make('span','hlm-visual__meta',p.position||'Position unavailable');
   if(p.rating!=null)meta.prepend(make('span','hlm-visual__rating',String(p.rating)),' ');
   b.append(meta);
   b.addEventListener('click',()=>{detail.hidden=false;detail.replaceChildren(make('h3','',p.name),make('p','', 'Position: '+(p.position||'Unavailable')),make('p','', 'Overall: '+(p.rating??'Not available')),make('p','hlm-visual__note','Read-only player information. No roster or lineup changes were made.'))});
   grid.append(b);
  }
  view.append(make('p','hlm-visual__note','Roster by listed position, not confirmed forward lines or defensive pairings. Line assignments will appear only when verified data supports them.'),grid);
  if(!buckets.some(b=>b.length))view.append(make('p','hlm-visual__empty','No eligible players with verified positions for this category.'));
 }
 doc.addEventListener('hlm:a1-state',event=>{
  const d=event.detail||{};
  state={loaded:d.loaded===true,teamName:String(d.teamName||''),roster:Array.isArray(d.visualRoster)?d.visualRoster.map(cleanPlayer).filter(Boolean):[]};
  draw();
 });
 draw();
}
root.HLMVisualLineup={mount,cleanPlayer,group,CATEGORIES};
if(typeof module==='object'&&module.exports)module.exports=root.HLMVisualLineup;
else if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>mount(root.document),{once:true});else mount(root.document)}
})(typeof globalThis!=='undefined'?globalThis:this);
