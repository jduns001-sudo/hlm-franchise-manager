'use strict';
// Experimental, pure and read-only; no production activation or save-store imports.
const {history}=require('./hlm-player-performance-multiseason');
const {summarize}=require('./hlm-player-performance-comparison-insights');
function filteredHistory(seasons,{from=-Infinity,to=Infinity,window=3}={}){
 if(typeof from!=='number'||typeof to!=='number'||Number.isNaN(from)||Number.isNaN(to)||from>to)throw new RangeError('season range');
 return history(seasons.filter(s=>s.season>=from&&s.season<=to),{window});
}
function profile(seasons,opts={}){
 const h=filteredHistory(seasons,opts);
 const rows=h.seasons.map(r=>Object.freeze({season:r.season,games:r.summary.games,consistency:r.summary.consistency,volatility:r.summary.volatility,pointsPerGame:r.summary.pointsPerGame,confidence:r.summary.reliability}));
 const games=h.seasons.reduce((a,r)=>a+r.summary.games,0);
 return Object.freeze({rows:Object.freeze(rows),trend:h.trend,sample:games>=20?'established':games>=5?'developing':'limited',disclaimer:'Historical descriptions only. No automated GM action.'});
}
function compareProfiles(a,b,opts={}){
 const left=profile(a,opts),right=profile(b,opts);
 const x=left.rows.at(-1),y=right.rows.at(-1);
 const eligible=left.sample!=='limited'&&right.sample!=='limited'&&x&&y&&x.pointsPerGame!==null&&y.pointsPerGame!==null;
 return Object.freeze({left,right,comparison:eligible?'directional-only':'insufficient-sample',latestPointsDelta:eligible?x.pointsPerGame-y.pointsPerGame:null});
}
module.exports={filteredHistory,profile,compareProfiles};
