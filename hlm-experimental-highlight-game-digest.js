'use strict';
/** Read-only synthetic game digest derived from verified period highlights. */
const {createExperimentalHighlightPeriodDigest}=require('./hlm-experimental-highlight-period-digest');
function createExperimentalHighlightGameDigest(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightPeriodDigest(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-game-digest',researchReady:false,blockers:source.blockers,periods:null,game:null,official:false,persistencePerformed:false};
 const periods=source.periods.map(p=>({period:p.period,eventCount:p.eventCount,firstOrdinal:p.firstOrdinal,lastOrdinal:p.lastOrdinal,score:{...p.score},shots:{...p.shots},typeCounts:{...p.typeCounts}}));
 const eventCount=periods.reduce((n,p)=>n+p.eventCount,0);
 const typeCounts={};
 for(const p of periods)for(const [type,count] of Object.entries(p.typeCounts))typeCounts[type]=(typeCounts[type]||0)+count;
 if(eventCount!==source.summary.eventCount)throw new Error('EXPERIMENTAL_GAME_DIGEST_EVENT_COUNT_MISMATCH');
 for(const [type,count] of Object.entries(source.summary.typeCounts))if(typeCounts[type]!==count)throw new Error('EXPERIMENTAL_GAME_DIGEST_TYPE_COUNT_MISMATCH');
 const last=periods.at(-1)||null;
 const game={periodsWithHighlights:periods.length,highlightCount:eventCount,typeCounts,latestHighlightedScore:last?{...last.score}:null,latestHighlightedShots:last?{...last.shots}:null,leaderAtLastHighlight:last?(last.score.home>last.score.away?'home':last.score.away>last.score.home?'away':'tied'):null};
 return {kind:'experimental-highlight-game-digest',researchReady:true,periods,game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightGameDigest};
