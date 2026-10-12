'use strict';
const {archiveCompletedSeason}=require('./hlm-phase10-season-history');
/** Safely archive the finished season and return a compact, display-ready summary. */
function finalizeChampionshipSeason(state,seasonId){
  const {nextState,record}=archiveCompletedSeason(state,seasonId);
  const standings=record.standings;
  return {nextState,summary:{
    seasonId:record.seasonId,
    championTeamId:record.championTeamId,
    completedDate:record.completedDate,
    regularSeasonGames:record.regularSeasonGames,
    playoffRoundCount:record.playoffRounds.length,
    standingsCount:standings.length,
    archivedSeasonCount:nextState.history.seasons.length
  }};
}
module.exports={finalizeChampionshipSeason};
