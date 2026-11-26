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
// Strict source-backed future picks only. Ambiguous identities are excluded, not repaired.
function importSourcePicks(universe,eligible){
 const source=Array.isArray(universe.draftPicks)?universe.draftPicks:[];
 const teamIds=new Set(eligible.map(t=>String(t.id)));
 const occurrences=new Map();
 const identity=p=>[p.league,p.year,p.originalTeamId,p.round].join(':');
 for(const p of source)if(p&&typeof p==='object')occurrences.set(identity(p),(occurrences.get(identity(p))||0)+1);
 const accepted=[],excluded=[];
 for(const p of source){
  if(!p||typeof p!=='object'||!Number.isSafeInteger(p.league)||!Number.isSafeInteger(p.year)||p.year<2026||p.year>2045||!Number.isSafeInteger(p.round)||p.round<1||p.round>7||
   !Number.isSafeInteger(p.originalTeamId)||!Number.isSafeInteger(p.teamId)||!teamIds.has(String(p.originalTeamId))||!teamIds.has(String(p.teamId))||occurrences.get(identity(p))!==1){
   excluded.push({reason:'ambiguous-or-out-of-scope-source-pick'});continue;
  }
  accepted.push({pickId:'DP-'+p.league+'-'+p.year+'-'+p.originalTeamId+'-'+p.round+'-1',league:p.league,year:p.year,round:p.round,originalTeamId:p.originalTeamId,currentOwnerId:p.teamId,status:'AVAILABLE',source:'hlm-universe.json'});
 }
 return {accepted,excludedCount:excluded.length};
}
// Position evidence is joined by permanent ID only; roster ownership is never imported.
// Source slash order supplies the primary position; LD/RD normalize to the engine's D role.
function positionTokens(value){
 if(typeof value!=='string')return null;
 const tokens=value.trim().toUpperCase().split('/').map(p=>p.trim());
 if(!tokens.length||tokens.some(p=>!['C','LW','RW','D','LD','RD','F','G'].includes(p)))return null;
 const normalized=[...new Set(tokens.map(p=>p==='LD'||p==='RD'?'D':p))];
 if(normalized.includes('G')&&normalized.length>1)return null;
 return normalized;
}
function normalizePosition(value){return positionTokens(value)?.[0]??null;}
function positionEvidence(record){
 const values=[record?.position,record?.pos].filter(v=>v!==undefined&&v!==null&&v!=='');
 if(!values.length)return null;
 const evidence=values.map(positionTokens);
 if(evidence.some(v=>!v)||evidence.some(v=>JSON.stringify(v)!==JSON.stringify(evidence[0])))return null;
 return JSON.stringify(evidence[0]);
}
function permanentId(value){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 const id=String(value);return /^[1-9]\d*$/.test(id)&&Number.isSafeInteger(Number(id))?id:null;
}
function positionIndex(sourceRoster){
 if(sourceRoster===undefined)return new Map();
 if(!sourceRoster||!Array.isArray(sourceRoster.players))throw Error('Position roster players required');
 const byId=new Map();
 for(const row of sourceRoster.players){
  const id=permanentId(row?.id);if(!id)continue;
  const evidence=positionEvidence(row);
  if(!byId.has(id))byId.set(id,evidence);
  else if(byId.get(id)!==evidence)byId.set(id,null); // Any ambiguity stays unresolved, regardless of row order.
 }
 return byId;
}
// A2-67 rating authority: roster snapshot ovr, joined only by canonical permanent ID.
// app.html's roster overlay and docs/DATA_MODEL.md identify Universe ovr as unreliable
// (it can contain jersey numbers). Never use it as a fallback. Unlike the legacy
// last-row overlay, require every matching row to supply the same valid 0–99 integer.
// Missing, invalid or conflicting evidence stays null; zero is a recorded value.
function ratingIndex(sourceRoster){
 const byId=new Map();
 for(const row of sourceRoster?.players||[]){
  const id=permanentId(row?.id);if(!id)continue;
  const raw=row.ovr;
  const value=typeof raw==='number'?raw:typeof raw==='string'&&/^\d+$/.test(raw.trim())?Number(raw.trim()):null;
  const rating=Number.isSafeInteger(value)&&value>=0&&value<=99?value:null;
  if(!byId.has(id))byId.set(id,rating);
  else if(byId.get(id)!==rating)byId.set(id,null);
 }
 return byId;
}
function build(universe,teamId,engine,sourceRoster){
 const eligible=teams(universe);if(!eligible.some(t=>String(t.id)===String(teamId)))throw Error('Select an active NHL franchise');
 if(!engine||typeof engine.createGameStateEnvelope!=='function'||typeof engine.generateRoundRobinSchedule!=='function'||typeof engine.validateGameStateEnvelope!=='function')throw Error('Validated Phase 10 engine required');
 const positions=positionIndex(sourceRoster);
 const ratings=ratingIndex(sourceRoster);
 const roster=universe.players.filter(p=>p&&!p.retired&&p.status!==-1&&eligible.some(t=>String(t.id)===String(p.teamId))).map(p=>{
  const hasCanonicalPosition=[p.position,p.pos].some(v=>v!==undefined&&v!==null&&v!=='');
  const evidence=hasCanonicalPosition?positionEvidence(p):positions.get(permanentId(p.id));
  return {id:p.id,name:p.name||[p.first,p.last].filter(Boolean).join(' '),teamId:p.teamId,position:evidence?JSON.parse(evidence)[0]:null,overall:ratings.get(permanentId(p.id))??null,potential:p.potential??null};
 });
 const sourcePicks=importSourcePicks(universe,eligible);
 const state=engine.createGameStateEnvelope({meta:{saveId:'isolated-new-franchise',controlledTeamId:eligible.find(t=>String(t.id)===String(teamId)).id,currentDate:'2026-10-20'},teams:eligible,players:roster,draftPicks:sourcePicks.accepted,games:engine.generateRoundRobinSchedule(eligible,'2026-10-20',2),extensions:{phase11ExperimentalRosterAwareScores:false}});
 if(!engine.validateGameStateEnvelope(state).valid||!state.activity.games.length)throw Error('Invalid starter GameState');
 return state;
}
const RATING_SOURCE_SHA256='e4b2aded3475d0c15e754a9b8bb357657de01d7da5605852050433dbcddb8a2e';
function repairError(code,message){throw Object.assign(new Error(message),{code});}
async function ratingDigest(text){return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');}
async function verifiedRatingSource(text){
 if(typeof text!=='string'||text.length>10000000||await ratingDigest(text)!==RATING_SOURCE_SHA256)repairError('INVALID_RATING_SOURCE','Rating source bytes do not match the verified roster snapshot');
 const roster=JSON.parse(text);positionIndex(roster);return roster;
}
function ratingRepairProposal(state,sourceRoster){
 if(String(state?.meta?.controlledTeamId)!=='5'||!state.meta.saveId||!Array.isArray(state.universe?.players)||state.universe.teams.filter(t=>String(t.id)==='5').length!==1)repairError('RATING_SCOPE','An existing Pittsburgh franchise is required');
 const seen=new Set(),ratings=ratingIndex(sourceRoster),candidate=JSON.parse(JSON.stringify(state)),rows=[],changes=[];
 for(let i=0;i<state.universe.players.length;i++){
  const p=state.universe.players[i],id=permanentId(p?.id);if(!id||seen.has(id))repairError('PLAYER_IDENTITY','Missing or duplicate permanent roster identity');seen.add(id);
  if(String(p.teamId)!=='5')continue;
  if(!Object.prototype.hasOwnProperty.call(p,'overall')||Object.prototype.hasOwnProperty.call(p,'ovr')||(p.overall!==null&&(!Number.isSafeInteger(p.overall)||p.overall<0||p.overall>99)))repairError('RATING_LAYOUT','Unsupported saved rating layout for '+id);
  const resolved=ratings.get(id)??null,after=resolved===null?p.overall:resolved;
  rows.push({id,name:typeof p.name==='string'&&p.name?p.name:'Name unavailable',before:p.overall,after,status:resolved===null?'Unverified source: excluded; saved value retained':after===p.overall?'Verified: unchanged':'Verified: correction'});
  if(resolved!==null&&after!==p.overall){changes.push({id,before:p.overall,after});candidate.universe.players[i].overall=after;}
 }
 if(!rows.length)repairError('RATING_SCOPE','No Pittsburgh roster players');
 return {rows,changes,candidatePayloadText:JSON.stringify(candidate)};
}
function ratingReviewText(backup,restoring=false){
 const b=backup.body,heading=restoring?'RESTORE ORIGINAL PITTSBURGH RATINGS':'REVIEW PITTSBURGH RATING CORRECTION';
 return heading+'\nFranchise '+JSON.parse(b.record.payloadText).meta.saveId+' | team 5 | epoch '+b.record.epoch+' | revision '+b.record.revision+'\nBackup SHA-256: '+backup.sha256+'\n'+b.rows.map(p=>p.name+' [ID: '+p.id+'] | '+String(restoring?p.after:p.before)+' → '+String(restoring?p.before:p.after)+' | '+p.status).join('\n')+'\nOnly verified rating changes; unresolved values retained. No lineup, participation or game approved. Existing saved GM decisions and completed results remain unchanged. Future rating-aware results may differ; review game-day decisions again.';
}
async function createRatingBackup(record,sourceText,origin,nonce){
 const roster=await verifiedRatingSource(sourceText);
 if(!record||record.authorityMode!=='active'||record.formatVersion!==1||typeof record.epoch!=='string'||!Number.isSafeInteger(record.revision)||record.revision<1||typeof origin!=='string'||!/^https?:\/\/[^/]+$/.test(origin)||typeof nonce!=='string'||nonce.length>128||!/^[A-Za-z0-9_.:-]+$/.test(nonce))repairError('INVALID_BACKUP','Active record, exact origin and review nonce required');
 const proposal=ratingRepairProposal(JSON.parse(record.payloadText),roster);
 if(!proposal.changes.length)repairError('NO_RATING_CHANGES','No verified rating changes to save');
 const body={origin,sourceSha256:RATING_SOURCE_SHA256,record:JSON.parse(JSON.stringify(record)),nonce,...proposal};
 const sha256=await ratingDigest(JSON.stringify(body));
 return {formatVersion:1,kind:'HLM27-PIT-rating-backup',body,sha256};
}
async function verifyRatingBackup(text,sourceText,origin){
 if(typeof text!=='string'||text.length>20000000)repairError('INVALID_BACKUP','Bounded backup file required');
 let b;try{b=JSON.parse(text)}catch{repairError('INVALID_BACKUP','Backup JSON is invalid')}
 if(b?.formatVersion!==1||b.kind!=='HLM27-PIT-rating-backup'||b.body?.origin!==origin||b.body?.sourceSha256!==RATING_SOURCE_SHA256||typeof b.sha256!=='string'||await ratingDigest(JSON.stringify(b.body))!==b.sha256)repairError('INVALID_BACKUP','Backup identity or checksum mismatch');
 const rebuilt=await createRatingBackup(b.body.record,sourceText,origin,b.body.nonce);
 if(JSON.stringify(rebuilt)!==JSON.stringify(b))repairError('INVALID_BACKUP','Backup content differs from its verified rating-only candidate');
 return b;
}
return {teams,build,importSourcePicks,normalizePosition,ratingRepairProposal,ratingDigest,createRatingBackup,verifyRatingBackup,ratingReviewText};
});
