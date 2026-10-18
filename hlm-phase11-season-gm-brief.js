/* Mission 1313: read-only, privacy-safe human GM season checkpoint brief. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonGMBrief=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function build(checkpoint){
 if(!checkpoint||checkpoint.kind!=='isolated-season-checkpoint'||checkpoint.finalDecisionMaker!=='human-gm'||checkpoint.productionActivationAllowed!==false||checkpoint.persistencePerformed!==false)throw Error('Verified isolated season checkpoint required');
 const whole=n=>Number.isSafeInteger(n)&&n>=0;
 if(!whole(checkpoint.controlledGamesCompleted)||!whole(checkpoint.controlledGamesRemaining)||!whole(checkpoint.leagueGamesCompleted)||!whole(checkpoint.leagueGamesRemaining))throw Error('Invalid checkpoint counts');
 const record=checkpoint.record||{};
 if(!whole(record.wins)||!whole(record.losses)||!whole(record.ties)||record.wins+record.losses+record.ties!==checkpoint.controlledGamesCompleted)throw Error('Invalid controlled team record');
 if(!Number.isSafeInteger(checkpoint.goalsFor)||!Number.isSafeInteger(checkpoint.goalsAgainst)||checkpoint.goalsFor<0||checkpoint.goalsAgainst<0||checkpoint.goalsFor-checkpoint.goalsAgainst!==checkpoint.goalDifferential)throw Error('Invalid goal evidence');
 const remaining=checkpoint.controlledGamesRemaining,played=checkpoint.controlledGamesCompleted;
 const next=checkpoint.nextGame;
 if(next&&(typeof next.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(next.date)||!['home','away'].includes(next.venue)))throw Error('Invalid next game evidence');
 if(Boolean(checkpoint.seasonComplete)!==(checkpoint.leagueGamesRemaining===0))throw Error('Invalid season completion evidence');
 const actions=[];
 if(!played)actions.push({priority:'review',topic:'baseline',explanation:'No controlled-team final scores yet. Avoid performance conclusions.',confidence:'insufficient',decision:'Human GM may review schedule only.'});
 if(played&&checkpoint.goalDifferential<0)actions.push({priority:'review',topic:'goal-balance',explanation:'Controlled-team goals against exceed goals for in completed games.',confidence:'score-only',decision:'Human GM may investigate lineup and goalie evidence before changing anything.'});
 if(played&&checkpoint.goalDifferential>=0)actions.push({priority:'informational',topic:'goal-balance',explanation:'Controlled-team goal differential is nonnegative in completed games.',confidence:'score-only',decision:'No automatic roster or lineup change.'});
 if(next)actions.push({priority:'review',topic:'next-game',explanation:'Next controlled-team game is '+next.venue+' on '+next.date+'.',confidence:'schedule-only',decision:'Human GM approves any subsequent isolated simulation day.'});
 if(!remaining)actions.push({priority:'informational',topic:'schedule',explanation:'No controlled-team games remain on the current schedule.',confidence:'schedule-only',decision:'Human GM decides whether to review season completion.'});
 actions.push({priority:'verification',topic:'evidence-gaps',explanation:'Roster verification, independent source confirmation and player-level statistics are not established by final scores.',confidence:'unverified',decision:'Collect independent evidence before making personnel decisions.'});
 return Object.freeze({kind:'isolated-human-gm-season-brief',asOfDate:typeof checkpoint.asOfDate==='string'?checkpoint.asOfDate:null,record:Object.freeze({wins:record.wins,losses:record.losses,ties:record.ties}),controlledGamesCompleted:played,controlledGamesRemaining:remaining,goalDifferential:checkpoint.goalDifferential,seasonComplete:checkpoint.seasonComplete,actions:Object.freeze(actions.map(x=>Object.freeze(x))),source:'isolated-scores-and-schedule-only',privateNotesIncluded:false,independentVerification:'pending',persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return Object.freeze({build});
});
