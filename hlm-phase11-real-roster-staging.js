/* Mission 1209: pure, isolated roster staging. No browser storage or schedule generation. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-game-state'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMRealRosterStaging=api;})(typeof globalThis!=='undefined'?globalThis:this,function(canonical){
'use strict';
function clone(v){return JSON.parse(JSON.stringify(v));}
function ids(records,label){const seen=new Set();for(const r of records){if(!r||r.id===null||r.id===undefined||String(r.id).trim()===''||seen.has(String(r.id)))throw Error('Missing or duplicate '+label+' identity');seen.add(String(r.id));}return seen;}
function stage(projection,approved,adapter){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!projection||projection.kind!=='front-office-readonly-gameplay-projection'||projection.readOnly!==true)throw Error('Validated Front Office projection required');
 const create=adapter&&adapter.createGameStateEnvelope||(canonical&&canonical.createGameStateEnvelope);
 const validate=adapter&&adapter.validateGameStateEnvelope||(canonical&&canonical.validateGameStateEnvelope);
 if(typeof create!=='function'||typeof validate!=='function')throw Error('Canonical GameState adapter required');
 const teams=clone(projection.teams),players=clone(projection.players),contracts=clone(projection.contracts),games=clone(projection.games);
 const teamIds=ids(teams,'team'),playerIds=ids(players,'player');ids(contracts,'contract');ids(games,'game');
 if(!teamIds.has(String(projection.controlledTeamId)))throw Error('Controlled team identity unresolved');
 for(const p of players)if(p.teamId!=null&&!teamIds.has(String(p.teamId)))throw Error('Player references unknown team');
 for(const c of contracts)if(c.playerId==null||!playerIds.has(String(c.playerId)))throw Error('Contract references unknown player');
 for(const g of games)if(!teamIds.has(String(g.homeTeamId))||!teamIds.has(String(g.awayTeamId))||String(g.homeTeamId)===String(g.awayTeamId))throw Error('Invalid game team mapping');
 if(typeof projection.currentDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(projection.currentDate)||!Number.isFinite(Date.parse(projection.currentDate+'T00:00:00Z')))throw Error('Valid franchise date required');
 if(projection.saveId==null||String(projection.saveId).trim()==='')throw Error('Source franchise identity required');
 const state=create({meta:{saveId:'isolated-stage:'+String(projection.saveId),controlledTeamId:projection.controlledTeamId,currentDate:projection.currentDate},teams,players,contracts,games,extensions:{staging:{source:'front-office',sourceSaveId:projection.saveId,sourceControlledTeamId:projection.controlledTeamId,productionActivationAllowed:false}}});
 if(!validate(state).valid)throw Error('Canonical GameState validation failed');
 return state;
}
return {stage};
});
