'use strict';
// Experimental, read-only and deterministic. No save storage or GM automation.
function trend(seasons,{years=[],metric='pointsPerGame'}={}){
 if(!Array.isArray(seasons)||!Array.isArray(years)||years.some(y=>!Number.isSafeInteger(y))||!['pointsPerGame','finishing'].includes(metric))throw new TypeError('invalid trend options');
 const allowed=new Set(years),rows=seasons.filter(s=>allowed.has(s.season)).slice().sort((a,b)=>a.season-b.season).map(s=>{
  if(!Array.isArray(s.games)||s.games.some(g=>![g.goals,g.assists,g.shots].every(v=>Number.isSafeInteger(v)&&v>=0)||s.games.some(g=>g.goals>g.shots))throw new RangeError('invalid game stats');
  const games=s.games.length,shots=s.games.reduce((n,g)=>n+g.shots,0),goals=s.games.reduce((n,g)=>n+g.goals,0),points=s.games.reduce((n,g)=>n+g.goals+g.assists,0);
  return Object.freeze({season:s.season,games,shots,value:metric==='finishing'?(shots?goals/shots:null):(games?points/games:null),sample:games>=20?'established':games>=5?'developing':'limited'});
 });
 const changes=rows.slice(1).map((r,i)=>Object.freeze({from:rows[i].season,to:r.season,delta:r.value===null||rows[i].value===null?null:r.value-rows[i].value,interpretation:r.games>=5&&rows[i].games>=5?'directional-only':'insufficient-sample'}));
 return Object.freeze({metric,rows:Object.freeze(rows),changes:Object.freeze(changes),notice:'Historical descriptive trends only. Human GM retains final authority.'});
}
function compare(player,team,options){return Object.freeze({player:trend(player,options),team:trend(team,options)});}
module.exports={trend,compare};
