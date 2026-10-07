'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-draft-rankings');
const state=createGameStateEnvelope({prospects:[{id:'p1'}]});const before=JSON.stringify(state);const rs=x.RANKING_TYPES.map((type,i)=>x.createProspectRanking(state,{type,entries:[{prospectId:'p1',rank:i+1}]}));
for(const r of rs){assert.strictEqual(r.rankingFormulaApplied,false);assert.strictEqual(r.actualAbilityExposed,false);}
const e=x.createDraftBoardEntry(state,{prospectId:'p1',teamId:'t1',tier:'caller',tags:x.DRAFT_BOARD_TAGS});assert.deepStrictEqual([...e.tags],['Target','Untouchable','Rising','Falling','Need More Scouting']);
const c=x.compareRankings(rs);assert.strictEqual(c.differencesPreserved,true);assert.strictEqual(c.consensusForced,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Draft ranking and board tests passed.');
