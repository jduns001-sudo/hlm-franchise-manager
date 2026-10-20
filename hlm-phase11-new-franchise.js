/* Mission 1381: explicit isolated franchise creation from real roster universe. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMNewFranchise=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Canonical active NHL records verified against the bundled HLM27 universe (2026-09-26).
// Abbreviations alone collide with junior, historical and other league records.
const CANONICAL=[
 [1,'NJD','New Jersey'],[2,'LII','Long Island'],[3,'NYR','New York'],[4,'PHI','Philadelphia'],[5,'PIT','Pittsburgh'],
 [6,'BOS','Boston'],[7,'BUF','Buffalo'],[8,'MTL','Montreal'],[9,'OTT','Ottawa'],[10,'TOR','Toronto'],
 [12,'CAR','Carolina'],[13,'FLA','Florida'],[14,'TBL','Tampa Bay'],[15,'WSH','Washington'],[16,'CHI','Chicago'],
 [17,'DET','Detroit'],[18,'NSH','Nashville'],[19,'STL','St. Louis'],[20,'CGY','Calgary'],[21,'COL','Colorado'],
 [22,'EDM','Edmonton'],[23,'VAN','Vancouver'],[24,'ANA','Anaheim'],[25,'DAL','Dallas'],[26,'LAK','Los Angeles'],
 [28,'SJS','San Jose'],[29,'CBJ','Columbus'],[30,'MIN','Minnesota'],[52,'WPG','Winnipeg'],[54,'VGK','Vegas'],
 [55,'SEA','Seattle'],[70,'UTA','Utah']
];
const CANONICAL_BY_ID=new Map(CANONICAL.map(([id,abbr,name])=>[String(id),{abbr,name}]));
function teams(universe){
 if(!universe||!Array.isArray(universe.teams)||!Array.isArray(universe.players))throw Error('Real roster universe required');
 const active=new Set(universe.players.filter(p=>p&&!p.retired&&p.status!==-1).map(p=>String(p.teamId)));
 const byId=new Map();
 for(const t of universe.teams){
  if(!t)continue;
  const expected=CANONICAL_BY_ID.get(String(t.id));
  if(!expected||t.abbr!==expected.abbr||t.name!==expected.name||!active.has(String(t.id)))continue;
  if(byId.has(String(t.id)))throw Error('Duplicate canonical NHL franchise identity: '+t.id);
  byId.set(String(t.id),{id:t.id,name:t.name,abbr:t.abbr});
 }
 return [...byId.values()].sort((a,b)=>a.name.localeCompare(b.name));
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
