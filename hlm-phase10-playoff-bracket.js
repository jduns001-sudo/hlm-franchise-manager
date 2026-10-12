'use strict';
const {createPlayoffSeries,recordPlayoffGame}=require('./hlm-phase10-playoffs');
function createPlayoffBracket(seeds,bestOf=7) {
  if(!Array.isArray(seeds)||seeds.length<2||(seeds.length&(seeds.length-1))!==0)throw new RangeError('Playoff field must be a power of two');
  const ordered=seeds.slice().sort((a,b)=>a.seed-b.seed);
  if(ordered.some((s,i)=>!s||!Number.isInteger(s.seed)||s.seed!==i+1||s.teamId==null)||new Set(ordered.map(s=>String(s.teamId))).size!==ordered.length)throw new Error('Seeds must be unique and numbered consecutively');
  const round=makeRound(ordered,bestOf);
  return {bestOf,rounds:[round],championTeamId:null,status:'active'};
}
function makeRound(seeds,bestOf){
  const matches=[];
  for(let i=0;i<seeds.length/2;i++)matches.push(createPlayoffSeries(seeds[i],seeds[seeds.length-1-i],bestOf));
  return matches;
}
function recordBracketGame(bracket,seriesIndex,result) {
  if(!bracket||bracket.status!=='active')throw new Error('Bracket is complete or invalid');
  const next=JSON.parse(JSON.stringify(bracket));
  const round=next.rounds[next.rounds.length-1];
  if(!Number.isInteger(seriesIndex)||seriesIndex<0||seriesIndex>=round.length)throw new RangeError('Invalid series index');
  round[seriesIndex]=recordPlayoffGame(round[seriesIndex],result);
  if(round.every(series=>series.status==='complete')){
    if(round.length===1){
      next.championTeamId=round[0].winnerTeamId;
      next.status='complete';
    }else{
      const advancing=round.map(series=>series.winnerTeamId===series.highSeed.teamId?series.highSeed:series.lowSeed).sort((a,b)=>a.seed-b.seed);
      next.rounds.push(makeRound(advancing,next.bestOf));
    }
  }
  return next;
}
module.exports={createPlayoffBracket,recordBracketGame};
