(function(global){'use strict';
/* Integration gate: never enables or calls production cutover. */
const SOURCE='hlm-phase11-imported-franchise-v1',DB='hlm_front_office_v8';
const backupFormat='hlm-phase11-verified-production-backup-v1';
const encode=new TextEncoder();
async function sha(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('')}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
async function preflight(workbench,fetcher,storage){
 if(!workbench||typeof workbench.candidate!=='function'||typeof workbench.current!=='function')throw Error('Workbench unavailable');
 const res=await fetcher('./hlm-universe.json',{cache:'no-store'});if(!res.ok)throw Error('Production universe unavailable');
 const universe=await res.json(),raw=storage.getItem(SOURCE);
 if(!raw||raw.length>5000000)throw Error('Missing staged import');
 const imported=JSON.parse(raw)?.universe;
 if(!Array.isArray(universe?.teams)||!Array.isArray(universe?.players)||!Array.isArray(imported?.teams)||!Array.isArray(imported?.players))throw Error('Invalid universe');
 const live=await workbench.current(),planned=workbench.candidate(),candidate=planned.state;
 if(live.schema!==7||candidate.schema!==7||!Array.isArray(live.customPlayers)||!Array.isArray(candidate.customPlayers))throw Error('Unsupported save schema');
 const existingIds=new Set(),targetIds=new Set();
 for(const t of universe.teams){const id=String(t?.id);if(t?.id==null||targetIds.has(id))throw Error('Duplicate production team');targetIds.add(id)}
 for(const p of [...universe.players,...live.customPlayers]){const id=String(p?.id);if(p?.id==null||existingIds.has(id))throw Error('Duplicate existing player ID');existingIds.add(id)}
 const incomingIds=new Set(),importedTeams=new Set(),assignedTeams=new Set();
 for(const t of imported.teams){if(!Number.isSafeInteger(t?.id)||importedTeams.has(String(t.id)))throw Error('Invalid imported team');importedTeams.add(String(t.id))}
 const mapped=workbench.assignments();
 for(const t of imported.teams){const id=mapped[String(t.id)];if(!targetIds.has(String(id))||assignedTeams.has(String(id)))throw Error('Invalid team mapping');assignedTeams.add(String(id))}
 for(const p of imported.players){const id=String(p?.id);if(!Number.isSafeInteger(p?.id)||existingIds.has(id)||incomingIds.has(id)||!importedTeams.has(String(p.teamId)))throw Error('Player ID collision or invalid team');incomingIds.add(id)}
 const additions=candidate.customPlayers.slice(live.customPlayers.length);
 if(additions.length!==imported.players.length||!additions.length)throw Error('Player count mismatch');
 for(let i=0;i<additions.length;i++){const a=additions[i],p=imported.players[i];if(a.id!==p.id||String(a.teamId)!==String(mapped[String(p.teamId)])||!targetIds.has(String(a.teamId)))throw Error('Mapped player mismatch')}
 if(!same(candidate.customPlayers.slice(0,live.customPlayers.length),live.customPlayers))throw Error('Existing custom players modified');
 for(const key of new Set([...Object.keys(live),...Object.keys(candidate)])){if(key!=='customPlayers'&&!same(live[key],candidate[key]))throw Error('Protected field changed: '+key)}
 return {candidate,addedPlayers:additions.length,productionWrites:0,automaticCutoverAllowed:false,controlledTeamId:live.settings?.controlledTeamId};
}
async function verifyReopenedBackup(text,workbench){
 if(typeof text!=='string'||text.length>6000000)throw Error('Backup too large');
 const doc=JSON.parse(text);
 if(doc?.format!=='hlm-phase11-workbench-backup-v1'||doc.source?.database!==DB||doc.source?.store!=='state'||doc.source?.key!=='db'||typeof doc.payload!=='string')throw Error('Backup provenance invalid');
 if(await sha(doc.payload)!==doc.sha256)throw Error('Backup SHA-256 mismatch');
 const live=await workbench.current();
 if(doc.payload!==JSON.stringify(live))throw Error('Production save differs from reopened backup');
 return {verified:true,sha256:doc.sha256,cutoverBackupText:JSON.stringify({format:backupFormat,source:{database:DB,store:'state',key:'db'},present:true,payload:doc.payload,sha256:doc.sha256})};
}
global.HLMPhase11CutoverIntegration={preflight,verifyReopenedBackup,productionCutoverEnabled:false};
const button=global.document?.getElementById('cutover-preflight');
if(button)button.onclick=async()=>{const out=global.document.getElementById('status');try{const r=await preflight(global.HLMPhase11ImportWorkbench,global.fetch.bind(global),global.localStorage);out.textContent=JSON.stringify({message:'Full-universe preflight passed. Production activation remains disabled.',addedPlayers:r.addedPlayers,controlledTeamId:r.controlledTeamId,productionWrites:0},null,2)}catch(e){out.textContent='Blocked: '+e.message}};
})(window);