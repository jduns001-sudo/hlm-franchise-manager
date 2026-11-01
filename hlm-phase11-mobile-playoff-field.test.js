'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {create}=require('./hlm-phase11-guarded-mobile-lifecycle');
const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
assert.ok(html.includes('HLMIsolatedSingleGame.createTransactional(engine,repository'));assert.ok(html.includes('HLMGuardedMobileLifecycle.createTransactional(manager)'));assert.ok(!html.includes('const state=manager.load(),bracket='));
let assertions=0;function check(condition,label){++assertions;assert.ok(condition,label)}
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);
check(/<option value="4" selected>4 teams<\/option>/.test(html),'four-team HTML default');
check(/<option value="16">16 teams<\/option>/.test(html),'explicit sixteen-team option');
const helper=html.slice(html.indexOf('let playoffQualificationPending=false;'),html.indexOf('function refresh(){refreshPostgameGames();'));
const handler=html.slice(html.indexOf("$('playoff-start').addEventListener('click',async()=>{"),html.indexOf("$('playoff-next').addEventListener('click'"));
function fixture(count=20){
 const elements=Object.fromEntries(['playoff-spots','playoff-start','playoff-field-status','playoff-report'].map(id=>[id,{value:id==='playoff-spots'?'4':'',disabled:false,textContent:'',events:{},addEventListener(event,fn){this.events[event]=fn}}]));
 const state={meta:{controlledTeamId:1},universe:{teams:Array.from({length:count},(_,i)=>({id:i+1}))},activity:{games:[{status:'final'}]},history:{seasons:[]},extensions:{}};
 let raw='ORIGINAL',locks=0,approvals=[];
 const manager={peek:()=>state,startPlayoffs:(approved,spots,bestOf)=>{approvals.push([approved,spots,bestOf]);raw='SAVED';state.extensions.phase10Playoffs={rounds:[Array.from({length:spots/2},()=>({}))],status:'active'};return {seeds:Array.from({length:spots},(_,i)=>({teamId:i+1}))}}};
 const guard=create(manager,{getItem:()=>raw},'hlm-phase11-m1340-isolated-single-game-v1');
 const context=vm.createContext({$:id=>elements[id],manager,lifecycleReview:guard,locked:async fn=>{++locks;return fn()},refresh:()=>{},applyStorageGate:()=>{},confirm:()=>false});
 vm.runInContext(helper+handler,context);
 return {elements,state,context,approvals,raw:()=>raw,locks:()=>locks,setRaw:s=>{raw=s},render:s=>context.refreshPlayoffField(s),click:()=>elements['playoff-start'].events.click()};
}
(async()=>{
 const f=fixture();f.render(null);check(f.elements['playoff-start'].disabled,'no franchise blocks qualification');check(/Load/.test(f.elements['playoff-field-status'].textContent),'no-save explanation');
 f.render(f.state);check(!f.elements['playoff-start'].disabled,'completed season enables default four');check(/Selected playoff field: 4/.test(f.elements['playoff-field-status'].textContent),'selected four displayed');
 f.elements['playoff-spots'].value='16';f.elements['playoff-spots'].events.change();check(/Selected playoff field: 16/.test(f.elements['playoff-field-status'].textContent),'selection change displayed');check(f.raw()==='ORIGINAL','selection is no-save');
 f.state.activity.games[0].status='scheduled';f.render(f.state);check(f.elements['playoff-start'].disabled,'incomplete season blocked');check(/Complete all regular-season/.test(f.elements['playoff-field-status'].textContent),'incomplete explanation');
 f.state.activity.games=[];f.render(f.state);check(/at least one/.test(f.elements['playoff-field-status'].textContent),'empty season explained');
 f.state.activity.games=[{status:'final'}];await f.click();check(f.raw()==='ORIGINAL'&&f.approvals.length===0&&f.locks()===0,'cancellation does not save or request write lock');check(!f.elements['playoff-spots'].disabled,'cancellation unlocks selection');
 const small=fixture(4);small.elements['playoff-spots'].value='16';small.render(small.state);check(small.elements['playoff-start'].disabled,'too-small sixteen field blocked');check(/16 required; 4 available/.test(small.elements['playoff-field-status'].textContent),'team count explained');
 for(const value of ['8','invalid']){f.elements['playoff-spots'].value=value;f.render(f.state);check(f.elements['playoff-start'].disabled,'invalid field blocked');check(/Choose 4 or 16/.test(f.elements['playoff-field-status'].textContent),'invalid field explained')}
 const snap=fixture();snap.elements['playoff-spots'].value='16';snap.context.confirm=message=>{check(/top 16 teams/.test(message),'confirmation names reviewed field');check(snap.elements['playoff-spots'].disabled,'selection locked during confirmation');snap.elements['playoff-spots'].value='4';return true};
 await snap.click();check(JSON.stringify(snap.approvals)==='[[true,16,7]]','approval retains snapshot despite later selection mutation');check(snap.locks()===1,'approval uses existing caller lock');check(snap.elements['playoff-spots'].disabled&&snap.elements['playoff-spots'].value==='16','persisted field replaces transient selection and locks');check(/Persisted playoff field: 16/.test(snap.elements['playoff-field-status'].textContent),'persisted field displayed');
 const stale=fixture();stale.context.confirm=()=>{stale.setRaw('OTHER_TAB');return true};await stale.click();check(stale.approvals.length===0&&stale.raw()==='OTHER_TAB','stale save rejected without overwrite');check(/changed/.test(stale.elements['playoff-report'].textContent),'stale failure reported');
 const legacy=fixture();legacy.context.confirm=()=>true;await legacy.click();check(legacy.approvals[0][1]===4,'default handler qualifies four');
 console.log('Mobile playoff field focused Node checks passed; assertions: '+assertions);
})().catch(e=>{console.error(e);process.exitCode=1});
