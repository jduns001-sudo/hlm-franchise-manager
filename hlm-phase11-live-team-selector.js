(function(global){'use strict';
const SOURCE='hlm-phase11-imported-franchise-v1';
async function inspect(fetcher,storage){
 const r=await fetcher('./hlm-universe.json',{cache:'no-store'});if(!r.ok)throw Error('Live universe unavailable');
 const universe=await r.json();
 if(!Array.isArray(universe.teams)||!Array.isArray(universe.players)||!universe.teams.length)throw Error('Invalid production universe');
 const raw=storage.getItem(SOURCE);if(!raw||raw.length>5000000)throw Error('No valid staged imported universe');
 const imported=JSON.parse(raw)?.universe;
 if(!imported||!Array.isArray(imported.teams)||!Array.isArray(imported.players))throw Error('Invalid imported universe');
 const targetIds=new Set(),baseIds=new Set();
 for(const t of universe.teams){if(t?.id===undefined||targetIds.has(String(t.id)))throw Error('Invalid production team IDs');targetIds.add(String(t.id))}
 for(const p of universe.players){if(p?.id===undefined||baseIds.has(String(p.id)))throw Error('Invalid production player IDs');baseIds.add(String(p.id))}
 const collisionIds=imported.players.filter(p=>baseIds.has(String(p.id))).map(p=>p.id);
 return {productionTeams:universe.teams.map(t=>({id:t.id,name:t.name||t.abbr||String(t.id)})),importedTeams:imported.teams.map(t=>({id:t.id,name:t.name||String(t.id)})),productionPlayers:baseIds.size,importedPlayers:imported.players.length,basePlayerIdCollisions:collisionIds,requiresExplicitAssignments:true,automaticCutoverAllowed:false,productionWrites:0};
}
global.HLMPhase11LiveTeamSelector={inspect};
})(window);