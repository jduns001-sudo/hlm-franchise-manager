'use strict';
// Experimental, deterministic and read-only. No save-store, app activation or GM actions.
const {profile}=require('./hlm-player-performance-interactive');
function interval(wins,n,z=1.96){
 if(!Number.isSafeInteger(wins)||!Number.isSafeInteger(n)||wins<0||n<0||wins>n)throw new RangeError('invalid observations');
 if(n===0)return Object.freeze({lower:null,upper:null,confidence:'insufficient-sample'});
 const p=wins/n,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/den;
 return Object.freeze({lower:Math.max(0,center-half),upper:Math.min(1,center+half),confidence:n>=30?'higher':n>=10?'moderate':'limited'});
}
function reliability(seasons,options={}){
 const p=profile(seasons,options);
 const rows=p.rows.map(r=>{
  const s=seasons.find(x=>x.season===r.season);
  const goals=s.games.reduce((n,g)=>n+g.goals,0),shots=s.games.reduce((n,g)=>n+g.shots,0);
  const bounds=interval(goals,shots);
  return Object.freeze({...r,goals,shots,finishing:shots?goals/shots:null,finishingInterval:bounds,sample:r.games>=20?'established':r.games>=5?'developing':'limited'});
 });
 return Object.freeze({rows:Object.freeze(rows),trend:p.trend,sample:p.sample,disclaimer:'Descriptive historical uncertainty, not a forecast. Human GM decides.'});
}
function compare(a,b,options={}){
 const left=reliability(a,options),right=reliability(b,options);
 const l=left.rows.at(-1),r=right.rows.at(-1);
 const comparable=!!l&&!!r&&l.games>=5&&r.games>=5;
 return Object.freeze({left,right,comparison:comparable?'directional-only':'insufficient-sample',consistencyDelta:comparable&&l.consistency!==null&&r.consistency!==null?l.consistency-r.consistency:null,volatilityDelta:comparable&&l.volatility!==null&&r.volatility!==null?l.volatility-r.volatility:null});
}
module.exports={interval,reliability,compare};
