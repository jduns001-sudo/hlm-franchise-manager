'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createIsolatedBridge,fixture,proposal,startServer}=require('./hlm-phase11-real-isolated-trade-bridge');
test('actual controller supplies source-backed players contracts and rights, no writes',()=>{
 const b=createIsolatedBridge(),before=b.inspect().raw,r=b.dispatch('review');
 assert.equal(r.status,'review-only');assert.equal(r.outgoing.name,'Alpha');assert.equal(r.incoming.aav,5);assert.equal(r.picks[0].year,2028);
 assert.equal(r.financialReviewed,true);assert.equal(r.restrictionsReviewed,true);assert.equal(r.independentlyAuthenticated,false);
 assert.equal(b.dispatch('approve').code,'settlement-disabled');assert.equal(b.dispatch('approve').code,'review-required');
 assert.equal(b.inspect().raw,before);assert.equal(b.inspect().writes,0);
});
test('decline cancel reload and stale review cannot persist',()=>{
 for(const action of ['decline','cancel']){const b=createIsolatedBridge();b.dispatch('review');assert.equal(b.dispatch(action).code,action);assert.equal(b.inspect().writes,0)}
 const b=createIsolatedBridge();b.dispatch('review');b.dispatch('reload');assert.equal(b.dispatch('approve').code,'review-required');
 const stale=createIsolatedBridge();stale.dispatch('review');stale.changeSource(stale.inspect().raw+' ');assert.equal(stale.dispatch('approve').code,'stale-review');assert.equal(stale.inspect().writes,0);
});
test('cap violation and invented pick rights are blocked by actual controller',()=>{
 const cap=fixture();cap.finances.teamCapLimits[1]=1;assert.throws(()=>createIsolatedBridge({fixture:cap}).dispatch('review'));
 const rights=fixture();rights.assets.draftPicks=[];assert.throws(()=>createIsolatedBridge({fixture:rights}).dispatch('review'));
});
test('loopback HTTP bridge only permits fixed review actions and no writes',async()=>{
 const server=await startServer();
 try{
  const u=new URL(server.url);
  assert.equal(u.hostname,'127.0.0.1');
  const post=action=>fetch(server.url+'isolated-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});
  const review=await post('review');assert.equal(review.status,200);assert.equal((await review.json()).outgoing.name,'Alpha');
  assert.equal((await (await post('settle')).json()).code,'unsupported-action');
  assert.equal((await (await post('approve')).json()).code,'settlement-disabled');
  assert.equal(server.bridge.inspect().writes,0);
  assert.equal((await fetch(server.url+'hlm_front_office_v8')).status,404);
 }finally{await server.close()}
});
