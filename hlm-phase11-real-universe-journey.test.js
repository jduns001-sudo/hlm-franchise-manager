'use strict';
// Connected real-universe acceptance: do not replace the shipped NHL roster or schedule.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const mobileHtml=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
assert.match(mobileHtml,/class="gm-command-dock" aria-label="GM mobile command dock"/);
for(const target of ['gm-next-action-heading','day-review','game','gm-roster','gm-daily-brief','gm-draft-pick','playoff-start','season-dashboard']){
 assert.ok(mobileHtml.includes('href="#'+target+'"'),'mobile command link missing: '+target);
 assert.ok(mobileHtml.includes('id="'+target+'"'),'mobile command target missing: '+target);
}
assert.match(mobileHtml,/\.gm-command-dock\{position:sticky/);

const universe=require('./hlm-universe.json');
const {build,teams}=require('./hlm-phase11-new-franchise');
const gameState=require('./hlm-game-state');
const schedule=require('./hlm-phase10-season-schedule');
const {createBrowserFranchiseSaveStore}=require('./hlm-phase10-browser-storage');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
const {calculateStandings}=require('./hlm-phase10-standings');
const {create}=require('./hlm-phase11-isolated-single-game');
const {startSeasonPlayoffs}=require('./hlm-phase10-season-playoffs');
const {simulateNextPlayoffGame}=require('./hlm-phase10-playoff-simulation');
const {finalizeChampionshipSeason}=require('./hlm-phase10-season-finalization');
const {completeOffseasonAndStartSeason}=require('./hlm-phase10-complete-offseason');
const engine={...gameState,...schedule,createBrowserFranchiseSaveStore,applyScheduledGame,simulateNextDay,calculateStandings,startSeasonPlayoffs,simulateNextPlayoffGame,finalizeChampionshipSeason,completeOffseasonAndStartSeason};
const memory=new Map([['hlm_front_office_v8','PRODUCTION_SENTINEL']]);
const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
const owner=teams(universe).find(t=>t.abbr==='PIT');
assert.ok(owner,'real Pittsburgh franchise must exist');
const original=build(universe,owner.id,engine);
assert.equal(original.meta.controlledTeamId,owner.id);
assert.equal(original.universe.teams.length,32);
assert.ok(original.universe.players.length>100,'real NHL player roster retained');
assert.ok(original.activity.games.length>12,'real schedule retained');
assert.equal(original.extensions.phase11ExperimentalRosterAwareScores,false);
const count=original.activity.games.length;
const manager=create(engine,storage);
assert.throws(()=>manager.stage(original,false),/approval/);
assert.equal(memory.size,1,'declined creation must not save');
manager.stage(original,true);
assert.throws(()=>manager.stage(original,true),/overwritten/);
const stale=create(engine,storage);
const first=manager.reviewNextDay();
assert.ok(first.games>0,'real schedule must have a playable first day');
assert.throws(()=>manager.advanceNextDay(1412,false),/approval/);
assert.equal(manager.load().activity.games.filter(g=>g.status==='scheduled').length,count);
const advanced=manager.advanceNextDay(1412,true);
assert.equal(advanced.state.activity.games.filter(g=>g.status==='final').length,first.games);
assert.equal(advanced.state.activity.games.length,count,'real schedule must not be replaced');
assert.equal(create(engine,storage).load().activity.games.filter(g=>g.status==='final').length,first.games,'reload continuity');
assert.throws(()=>stale.advanceNextDay(1412,true),/changed/);
assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
assert.equal(advanced.state.extensions.phase11ExperimentalRosterAwareScores,false);
// Finish the authentic full schedule. Each day is separately reviewed and GM-approved.
let days=1;
while(manager.load().activity.games.some(g=>g.status==='scheduled')){
 const reviewed=manager.reviewNextDay();
 assert.ok(reviewed.games>0);
 manager.advanceNextDay(1412+days,true);
 if(++days>count)throw Error('Regular season did not terminate');
}
assert.equal(manager.load().activity.games.filter(g=>g.status==='final').length,count);
assert.throws(()=>manager.startPlayoffs(false),/approval/);
manager.startPlayoffs(true);
let playoffGames=0;
while(manager.load().extensions.phase10Playoffs.status==='active'){
 assert.throws(()=>manager.advancePlayoff(1412+playoffGames,false),/approval/);
 manager.advancePlayoff(1412+playoffGames,true);
 if(++playoffGames>21)throw Error('Best-of-seven playoffs did not terminate');
}
assert.ok(playoffGames>=12&&playoffGames<=21,'four-team best-of-seven bracket');
assert.throws(()=>manager.archiveSeason('2026-27',false),/approval/);
manager.archiveSeason('2026-27',true);
const options={contracts:{expiredContractIds:[],signings:[]},draftSelections:[],nextSeason:{completedSeasonId:'2026-27',nextSeasonId:'2027-28',startDate:'2027-10-01',cycles:2}};
const beforeOffseason=storage.getItem(manager.key);
const preview=manager.reviewOffseason(options);
assert.ok(preview.proposedGames>0);
assert.equal(storage.getItem(manager.key),beforeOffseason,'review is read-only');
assert.throws(()=>manager.approveReviewedOffseason(false),/approval/);
assert.equal(storage.getItem(manager.key),beforeOffseason,'decline is no-save');
manager.approveReviewedOffseason(true);
const rolled=create(engine,storage).load();
assert.equal(rolled.meta.controlledTeamId,owner.id);
assert.equal(rolled.universe.teams.length,32);
assert.equal(rolled.universe.players.length,original.universe.players.length);
assert.equal(rolled.history.seasons.length,1);
assert.equal(rolled.extensions.phase10CurrentSeasonId,'2027-28');
assert.ok(rolled.activity.games.some(g=>g.status==='scheduled'));
assert.equal(rolled.extensions.phase11ExperimentalRosterAwareScores,false);
assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
console.log('Real universe complete: '+count+' regular-season games, '+playoffGames+' playoff games, GM-approved championship archive, reviewed next season, reload, stale rejection, production isolation and default-off passed');

// Mission 1415: mobile day decision center preserves the existing human-approved day path.
{
 const fs=require('node:fs');
 const html=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
 for(const id of ['gm-day-command-heading','gm-day-command-status','gm-day-command-review','gm-day-command-confirm','gm-day-command-decline'])require('node:assert/strict').ok(html.includes('id="'+id+'"'),'Missing mobile day control '+id);
 require('node:assert/strict').match(html,/gm-day-command-confirm'\)\.addEventListener\('click'/);
 require('node:assert/strict').match(html,/gm-day-command-decline'\)\.addEventListener\('click'/);
 require('node:assert/strict').match(html,/reviewedDay=null;\$\('day-approve'\)\.disabled=true/);
}
