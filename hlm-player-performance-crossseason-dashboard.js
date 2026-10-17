'use strict';
// Experimental read-only cross-season summary. No production integration or GM automation.
const {comparison}=require('./hlm-player-performance-confidence-comparison');
function summarize(left,right,years){
 if(!Array.isArray(years)||years.some(y=>!Number.isSafeInteger(y)))throw new TypeError('invalid year selection');
 const unique=[...new Set(years)].sort((a,b)=>a-b);
 const result=comparison(left,right,{years:unique});
 const a=result.left.summary,b=result.right.summary;
 const confidence=a.games>=30&&b.games>=30?'higher':a.games>=10&&b.games>=10?'moderate':'limited';
 const difference=result.finishingDelta;
 return Object.freeze({years:Object.freeze(unique),player:a,team:b,finishingDelta:difference,confidence,interpretation:result.interpretation,explanation:result.interpretation==='insufficient-sample'?'Not enough comparable games or shots to interpret a difference.':confidence==='limited'?'Directional only: small samples are volatile.':confidence==='moderate'?'Directional only: moderate sample support, not predictive.':'Directional only: larger historical sample, not predictive.',notice:'Read-only historical context. Human GM retains final authority.'});
}
module.exports={summarize};
