'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='hlm-phase11-isolated-single-game.html';
const source=fs.readFileSync(file,'utf8');
const baseline=execFileSync('git',['show','797355f85b161af5a837a0c055b690f9f54056c3:'+file],{encoding:'utf8'});
// Boundaries are the next existing statement, not a reimplementation of approval.
const start=source.indexOf('function beginDayPerformance(){');
const stop=source.indexOf("const workspaceStatus",start);
assert.ok(start>0&&stop>start);
const oldStart=baseline.indexOf("$('day-approve').addEventListener('click',async()=>");
const original=baseline.slice(oldStart,baseline.indexOf('\n',oldStart));
const instrumented=source.slice(start,source.indexOf('\n});',start)+5);
async function run(code,mode,enabled){
 const events=[],calls=[],els={'day-approve':{disabled:false,addEventListener:(n,fn)=>{callback=fn}},'day-report':{textContent:''}};
 let callback,clock=0,saves=0;
 const review={fromDate:'2026-10-18',toDate:'2026-10-19',games:1,matchups:[]};
 const context={sessionStorage:{getItem:()=>{if(mode==='storage-error')throw Error('blocked');return enabled}},performance:{now:()=>{calls.push('clock');if(mode==='clock-error')throw Error('clock');return ++clock}},console:{info:(tag,e)=>{if(mode==='console-error')throw Error('console');events.push(JSON.parse(JSON.stringify(e)))}},$:id=>els[id],reviewedDay:mode==='no-review'?null:review,confirm:()=>mode!=='cancel',locked:async fn=>{calls.push('lock');if(mode==='lock-error')throw Error('lock blocked');return fn()},manager:{reviewNextDay:()=>{calls.push('validate');return mode==='changed'?{...review,games:2}:review},advanceNextDay:(seed,approved)=>{assert.equal(seed,1341);assert.equal(approved,true);calls.push('advance');if(mode==='stale')throw Error('Isolated save changed; reload first');saves++;return {toDate:review.toDate,results:[{}]}}},refresh:()=>{calls.push('refresh');if(mode==='refresh-error')throw Error('refresh blocked')}};
 vm.runInNewContext(code,context);await callback();
 return {events,saves,calls:calls.filter(x=>x!=='clock'),clockCalls:calls.filter(x=>x==='clock').length,report:els['day-report'].textContent,disabled:els['day-approve'].disabled,reviewed:context.reviewedDay};
}
(async()=>{
 let count=0;
 for(const mode of ['success','cancel','no-review','changed','stale','lock-error','refresh-error','storage-error','clock-error','console-error']){
  const expected=await run(original,mode,null);
  for(const flag of [null,'0','true','1']){
   const actual=await run(instrumented,mode,flag);
   for(const key of ['saves','calls','report','disabled','reviewed'])assert.deepEqual(actual[key],expected[key],mode+' '+flag+' '+key);
   if(flag!=='1'||['cancel','no-review','storage-error'].includes(mode)){assert.equal(actual.events.length,0);assert.equal(actual.clockCalls,0);}
   if(flag==='1'&&mode==='success'){
    assert.deepEqual(actual.events.filter(e=>e.event==='end').map(e=>e.stage),['lock_wait','review_validation','advance_and_persist','ui_refresh']);
    assert.equal(actual.events.at(-1).event,'complete');
    assert.ok(actual.events.filter(e=>e.elapsedMs!==null).every(e=>e.elapsedMs>=0));
    assert.ok(actual.events.every(e=>Object.keys(e).sort().join(',')==='elapsedMs,event,stage'));
   }
   count++;
  }
 }
 console.log('PASS A6: '+count+' handler parity cases against exact HEAD (flags, cancellation, missing review, stale/changed review, lock/refresh failure, unavailable diagnostics).');
})().catch(e=>{console.error(e);process.exitCode=1});
