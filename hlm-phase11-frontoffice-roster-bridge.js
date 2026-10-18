/* Read-only mapping from actual Front Office db.players/db.teams/db.settings to experimental preview. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-roster-preview-adapter.js'):root.HLMRosterPreviewAdapter);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMFrontOfficeRosterBridge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(adapter){
'use strict';
function preview(db,options){if(!adapter||typeof adapter.preview!=='function')throw Error('Preview adapter unavailable');if(!options||options.humanApproved!==true)throw Error('Human GM preview approval required');if(!db||!Array.isArray(db.teams)||!Array.isArray(db.players)||!db.settings)throw Error('Invalid Front Office database');
const knownTeams=new Set(db.teams.map(t=>String(t.id)));const eligible=db.players.filter(p=>!p.retired&&p.teamId!==null&&p.teamId!==undefined);const valid=eligible.filter(p=>knownTeams.has(String(p.teamId)));const excluded=eligible.length-valid.length;
const source={meta:{controlledTeamId:db.settings.controlledTeamId},universe:{teams:db.teams.map(t=>({id:t.id,name:t.name})),players:valid.map(p=>({id:p.id,teamId:p.teamId}))}};
const result=adapter.preview(source,options);const classification=(typeof globalThis!=='undefined'&&globalThis.HLMImportedTeamClassification)||((typeof module==='object'&&module.exports)?require('./hlm-phase11-imported-team-classification.js'):null);const summary=classification?classification.classify(db):null;return Object.freeze({...result,source:'front-office-read-only',excludedUnknownTeamCount:excluded,importedTeamClassification:summary,productionWrite:false,activationEnabled:false});}
return Object.freeze({preview,activationEnabled:false});
});
