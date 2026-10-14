(function(global){'use strict';
/* Test-only read-only roster proof. No production activation API. */
function materialize(universe,state){
 if(!universe||!Array.isArray(universe.players)||!Array.isArray(universe.teams)||state?.schema!==7||!Array.isArray(state.customPlayers))throw Error('Invalid Front Office universe/save');
 const teamIds=new Set(universe.teams.map(t=>String(t.id))),ids=new Set();
 const players=[...universe.players,...state.customPlayers].map(p=>({...p}));
 for(const p of players){if(p.id==null||ids.has(String(p.id)))throw Error('Duplicate base/custom player ID');ids.add(String(p.id));if(p.teamId!=null&&!teamIds.has(String(p.teamId)))throw Error('Unknown roster team')}
 const controlled=state.settings?.controlledTeamId;
 if(controlled==null||!teamIds.has(String(controlled)))throw Error('Controlled team unavailable');
 return {players,controlledTeam:players.filter(p=>!p.retired&&String(p.teamId)===String(controlled)),controlledTeamId:controlled};
}
async function readSaved(idb){const db=await new Promise((resolve,reject)=>{const r=idb.open('hlm_front_office_v8');r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=db.transaction('state','readonly').objectStore('state').get('db');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
global.HLMPhase11PlayableRosterProof={materialize,readSaved,activationEnabled:false};
})(window);