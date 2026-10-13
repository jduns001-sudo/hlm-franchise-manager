'use strict';
/** Deterministic read-only recap of synthetic verified highlight summaries. */
const {createExperimentalHighlightGameDigest}=require('./hlm-experimental-highlight-game-digest');
function createExperimentalHighlightRecap(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightGameDigest(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-recap',researchReady:false,blockers:source.blockers,recap:null,official:false,persistencePerformed:false};
 const periods=source.periods.map(p=>({period:p.period,highlights:p.eventCount,types:{...p.typeCounts},score:{...p.score},shots:{...p.shots}}));
 const eventCount=periods.reduce((sum,p)=>sum+p.highlights,0);
 if(eventCount!==source.game.highlightCount)throw new Error('EXPERIMENTAL_RECAP_COUNT_MISMATCH');
 const types={};
 for(const period of periods)for(const [type,count] of Object.entries(period.types))types[type]=(types[type]||0)+count;
 for(const [type,count] of Object.entries(source.game.typeCounts))if(types[type]!==count)throw new Error('EXPERIMENTAL_RECAP_TYPE_MISMATCH');
 const recap={periods,highlightCount:eventCount,periodsWithHighlights:periods.length,typeCounts:types,latestHighlightedScore:source.game.latestHighlightedScore?{...source.game.latestHighlightedScore}:null,latestHighlightedShots:source.game.latestHighlightedShots?{...source.game.latestHighlightedShots}:null,leaderAtLastHighlight:source.game.leaderAtLastHighlight};
 return {kind:'experimental-highlight-recap',researchReady:true,recap,official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightRecap};
