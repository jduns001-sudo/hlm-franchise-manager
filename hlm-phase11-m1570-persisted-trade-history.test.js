'use strict';
const assert=require('node:assert/strict');
const {tradeHistory}=require('./hlm-phase11-m1570-persisted-trade-history');
const clone=x=>JSON.parse(JSON.stringify(x));
function record(id='trade_2',revision=2){return {id,type:'experimental-player-trade',experimental:true,
 sourceRevision:revision-1,revision,gmApproved:true,cpuConsentAuthenticated:false,productionSettlementAuthorized:false,
 transfers:[{playerId:'pA',playerName:'Alex <img>',fromTeamId:'A',fromTeamName:'Alpha',toTeamId:'B',toTeamName:'Beta',aav:4},
 {playerId:'pB',playerName:'Blair',fromTeamId:'B',fromTeamName:'Beta',toTeamId:'A',toTeamName:'Alpha',aav:7}]}}
const game={meta:{revision:3},activity:{transactions:[{id:'unrelated',type:'signing'},record(),record('trade_3',3)]}};
const ledger={revision:3,events:[{id:'seed',experimental:true},{id:'trade_2',experimental:true},{id:'trade_3',experimental:true}]};
const before=JSON.stringify({game,ledger});
const result=tradeHistory(game,ledger);assert.equal(result.ok,true);
assert.deepEqual(result.entries.map(t=>t.revision),[3,2]);
assert.equal(result.entries[1].transfers[0].playerName,'Alex <img>','history preserves saved names as plain data');
result.entries[0].transfers[0].playerName='Changed';
assert.equal(JSON.stringify({game,ledger}),before,'history view cannot mutate source');
assert.deepEqual(tradeHistory({meta:{revision:1},activity:{transactions:[]}}, {revision:1,events:[{id:'legacy_trade',experimental:true}]}),{ok:true,entries:[]},'legacy ledger IDs must not invent trade details');
const mutations=[
 (g,l)=>{l.revision=2},(g,l)=>{l.events.pop()},(g,l)=>{l.events.push(clone(l.events[1]))},
 g=>{g.activity.transactions.push(clone(g.activity.transactions[1]))},
 g=>{g.activity.transactions[1].productionSettlementAuthorized=true},
 g=>{g.activity.transactions[1].cpuConsentAuthenticated=true},
 g=>{g.activity.transactions[1].gmApproved=false},g=>{g.activity.transactions[1].experimental=false},
 g=>{g.activity.transactions[1].sourceRevision=0},g=>{g.activity.transactions[1].revision=4},
 g=>{g.activity.transactions[1].transfers[0].aav=-1},
 g=>{g.activity.transactions[1].transfers[1].playerId='pA'},
 g=>{g.activity.transactions[1].transfers[1].toTeamId='C'},
 g=>{g.activity.transactions[1].transfers[0].fromTeamName=''},
 g=>{g.activity.transactions[1].transfers=null}
];
for(const mutate of mutations){const g=clone(game),l=clone(ledger);mutate(g,l);
 const snapshot=JSON.stringify({g,l}),r=tradeHistory(g,l);
 assert.equal(r.ok,false);assert.deepEqual(r.entries,[],'ambiguous or unsupported history is never partially reported as committed');
 assert.equal(JSON.stringify({g,l}),snapshot);
}
console.log('M1570 trade history: ledger membership, reciprocal transfers, immutable view, revision order, legacy omissions and malformed-record rejection passed');
