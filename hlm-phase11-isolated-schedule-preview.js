/* Mission 1211: deterministic schedule preview and explicit isolated-only apply. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase10-season-schedule'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gameplay-readiness'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSchedulePreview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(scheduleModule,readinessModule){
'use strict';
function validate(state){
 if(!state||!state.meta||!state.universe||!state.activity||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players)||!Array.isArray(state.activity.games))throw Error('Canonical staged GameState required');
 if(state.activity.games.length)throw Error('Existing schedule must not be replaced');
 const report=(readinessModule||globalThis.HLMGameplayReadiness).evaluate(state);
 const ignored=new Set(['SCHEDULE_MISSING','NO_UPCOMING_GAMES']);
 if(report.issues.some(i=>i.severity==='blocker'&&!ignored.has(i.code)))throw Error('Franchise identity, roster or contract blockers prevent schedule preview');
 if(!state.universe.teams.some(t=>String(t.id)===String(state.meta.controlledTeamId)))throw Error('Controlled team missing');
 return report;
}
function preview(state,cycles=2,adapter){
 validate(state);
 const generator=(adapter&&adapter.generateRoundRobinSchedule)||(scheduleModule&&scheduleModule.generateRoundRobinSchedule)||(typeof globalThis!=='undefined'&&globalThis.HLMPhase10&&globalThis.HLMPhase10.generateRoundRobinSchedule);
 if(typeof generator!=='function')throw Error('Existing Phase 10 schedule generator unavailable');
 const games=generator(state.universe.teams,state.meta.currentDate,cycles);
 const ids=new Set(),teams=new Set(state.universe.teams.map(t=>String(t.id)));
 for(const g of games){if(!g||g.id==null||ids.has(String(g.id))||!teams.has(String(g.homeTeamId))||!teams.has(String(g.awayTeamId))||String(g.homeTeamId)===String(g.awayTeamId)||typeof g.date!=='string'||g.date<=state.meta.currentDate)throw Error('Invalid generated game mapping or date');ids.add(String(g.id));}
 return {kind:'experimental-isolated-schedule-preview',saveId:state.meta.saveId,controlledTeamId:state.meta.controlledTeamId,currentDate:state.meta.currentDate,cycles,games:JSON.parse(JSON.stringify(games)),productionActivationAllowed:false,persistencePerformed:false,gmApprovalStillRequired:true};
}
function applyIsolated(state,plan,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!plan||plan.kind!=='experimental-isolated-schedule-preview')throw Error('Schedule preview required');
 const expected=preview(state,plan.cycles);
 if(JSON.stringify(expected)!==JSON.stringify(plan))throw Error('Schedule preview stale or modified');
 const next=JSON.parse(JSON.stringify(state));next.activity.games=JSON.parse(JSON.stringify(plan.games));return next;
}
return {preview,applyIsolated};
});
