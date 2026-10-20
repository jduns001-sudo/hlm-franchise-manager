/* Mission 1381: explicit isolated franchise creation from real roster universe. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMNewFranchise=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const NHL=new Set('ANA BOS BUF CAR CBJ CGY CHI COL DAL DET EDM FLA LAK MIN MTL NJD NSH NYI NYR OTT PHI PIT SEA SJS STL TBL TOR UTA VAN VGK WPG WSH'.split(' '));
const aliases={LII:'NYI',VAN:'VAN',LAK:'LAK'};
function teams(universe){
 if(!universe||!Array.isArray(universe.teams)||!Array.isArray(universe.players))throw Error('Real roster universe required');
 const active=new Set(universe.players.filter(p=>p&&!p.retired&&p.status!==-1).map(p=>String(p.teamId)));
 return universe.teams.filter(t=>t&&NHL.has(aliases[t.abbr]||t.abbr)&&active.has(String(t.id))).map(t=>({id:t.id,name:t.name,abbr:t.abbr})).sort((a,b)=>a.name.localeCompare(b.name));
}
function build(universe,teamId,engine){
 const eligible=teams(universe);if(!eligible.some(t=>String(t.id)===String(teamId)))throw Error('Select an active NHL franchise');
 if(!engine||typeof engine.createGameStateEnvelope!=='function'||typeof engine.generateRoundRobinSchedule!=='function'||typeof engine.validateGameStateEnvelope!=='function')throw Error('Validated Phase 10 engine required');
 const roster=universe.players.filter(p=>p&&!p.retired&&p.status!==-1&&eligible.some(t=>String(t.id)===String(p.teamId))).map(p=>({id:p.id,name:p.name||[p.first,p.last].filter(Boolean).join(' '),teamId:p.teamId,position:p.position||p.pos||null,overall:Number(p.ovr)||null,potential:p.potential??null}));
 const state=engine.createGameStateEnvelope({meta:{saveId:'isolated-new-franchise',controlledTeamId:eligible.find(t=>String(t.id)===String(teamId)).id,currentDate:'2026-10-20'},teams:eligible,players:roster,games:engine.generateRoundRobinSchedule(eligible,'2026-10-20',2),extensions:{phase11ExperimentalRosterAwareScores:false}});
 if(!engine.validateGameStateEnvelope(state).valid||!state.activity.games.length)throw Error('Invalid starter GameState');
 return state;
}
return {teams,build};
});
