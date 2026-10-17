'use strict';
// Pure experimental read-only confidence-aware comparisons; never mutates saves.
const {reliability}=require('./hlm-player-performance-reliability');
function selected(seasons,years){
 if(!Array.isArray(seasons)||!Array.isArray(years)||years.some(y=>!Number.isSafeInteger(y)))throw new TypeError('invalid seasons');
 const allowed=new Set(years);
 return seasons.filter(s=>allowed.has(s.season));
}
function aggregate(rows){
 const games=rows.reduce((n,r)=>n+r.games,0),shots=rows.reduce((n,r)=>n+r.shots,0),goals=rows.reduce((n,r)=>n+r.goals,0);
 return Object.freeze({games,shots,goals,finishing:shots?goals/shots:null,sample:games>=20?'established':games>=5?'developing':'limited'});
}
function comparison(left,right,{years=[]}={}){
 const a=reliability(selected(left,years)),b=reliability(selected(right,years));
 const x=aggregate(a.rows),y=aggregate(b.rows);
 const usable=x.games>=5&&y.games>=5&&x.shots>0&&y.shots>0;
 return Object.freeze({left:Object.freeze({seasons:a.rows,summary:x}),right:Object.freeze({seasons:b.rows,summary:y}),interpretation:usable?'directional-only':'insufficient-sample',finishingDelta:usable?x.finishing-y.finishing:null,notice:'Descriptive uncertainty only; human GM makes every decision.'});
}
module.exports={selected,aggregate,comparison};
