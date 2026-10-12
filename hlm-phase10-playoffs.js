'use strict';
function seedPlayoffs(standings,spots=4) {
  if(!Array.isArray(standings)||!Number.isInteger(spots)||spots<2||spots>standings.length||spots%2)throw new RangeError('Invalid playoff field size');
  const ordered=standings.slice().sort((a,b)=>(b.points||0)-(a.points||0)||(b.w||0)-(a.w||0)||((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0))||String(a.teamId).localeCompare(String(b.teamId)));
  const ids=ordered.map(row=>row.teamId);
  if(ids.some(id=>id==null)||new Set(ids.map(String)).size!==ids.length)throw new Error('Invalid team IDs');
  return ordered.slice(0,spots).map((row,index)=>({seed:index+1,teamId:row.teamId}));
}
function createPlayoffSeries(highSeed,lowSeed,bestOf=7) {
  if(!highSeed||!lowSeed||highSeed.teamId==null||lowSeed.teamId==null||highSeed.teamId===lowSeed.teamId)throw new Error('Series requires two different teams');
  if(!Number.isInteger(bestOf)||bestOf<1||bestOf%2!==1)throw new RangeError('Best-of must be a positive odd number');
  return {highSeed:{...highSeed},lowSeed:{...lowSeed},bestOf,games:[],wins:{[String(highSeed.teamId)]:0,[String(lowSeed.teamId)]:0},winnerTeamId:null,status:'active'};
}
function recordPlayoffGame(series,result) {
  if(!series||series.status!=='active')throw new Error('Series is not active');
  const ids=[series.highSeed.teamId,series.lowSeed.teamId];
  if(!result||!ids.includes(result.winnerTeamId)||result.homeTeamId===result.awayTeamId||!ids.includes(result.homeTeamId)||!ids.includes(result.awayTeamId)||result.status!=='final')throw new Error('Invalid series game result');
  if(result.gameId==null||series.games.some(g=>String(g.gameId)===String(result.gameId)))throw new Error('Duplicate or missing playoff game ID');
  const next=JSON.parse(JSON.stringify(series));
  next.games.push({...result});
  const key=String(result.winnerTeamId);
  next.wins[key]++;
  if(next.wins[key]>=Math.floor(next.bestOf/2)+1){next.status='complete';next.winnerTeamId=result.winnerTeamId;}
  return next;
}
module.exports={seedPlayoffs,createPlayoffSeries,recordPlayoffGame};
