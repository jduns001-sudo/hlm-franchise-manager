'use strict';
/* Experimental isolated gameplay: deterministic lineup ice-time allocation.
   Pure projection only; no production saves, roster mutations or auto GM changes. */
function allocateLineupIceTime(lineup,periodMinutes=20){
 if(!Array.isArray(lineup)||!Number.isFinite(periodMinutes)||periodMinutes<=0)throw new TypeError('Valid lineup and positive periodMinutes required');
 const players=lineup.map((player,index)=>{
  if(!player||typeof player.id!=='string'||!player.id.trim()||!Number.isFinite(player.weight)||player.weight<=0)throw new TypeError('Each player needs a unique id and positive weight');
  return {id:player.id,weight:player.weight,index};
 });
 if(new Set(players.map(x=>x.id)).size!==players.length)throw new TypeError('Duplicate player id');
 const total=players.reduce((sum,p)=>sum+p.weight,0);
 const totalSeconds=Math.round(periodMinutes*60*5);
 const allocation=players.map(p=>({...p,seconds:Math.floor(totalSeconds*p.weight/total)}));
 let remaining=totalSeconds-allocation.reduce((sum,p)=>sum+p.seconds,0);
 const remainderOrder=players.map(p=>({index:p.index,fraction:(totalSeconds*p.weight/total)%1})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
 for(let i=0;i<remaining;i++)allocation[remainderOrder[i].index].seconds++;
 return {experimental:true,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  totalSkaterSeconds:totalSeconds,players:allocation.map(p=>({id:p.id,iceTimeSeconds:p.seconds}))};
}
module.exports={allocateLineupIceTime};
