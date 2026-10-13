'use strict';
/* Isolated schema-7 compatibility gate, never mutates or migrates production saves. */
const {FORMAT,validateSnapshot}=require('./hlm-phase11-indexeddb-backup');
const {packageSnapshot,verifyReopenedFile}=require('./hlm-phase11-durable-file-verify');
const EXPECTED_DB='hlm_front_office_v8',LEGACY_DB='hlm_front_office_v5',SCHEMA=7;
function validateFranchise(snapshot){
 validateSnapshot(snapshot);
 if(!snapshot.existed)throw Error('Missing franchise state');
 const s=snapshot.state;
 if(!Number.isInteger(s.schema)||s.schema!==SCHEMA)throw Error('Incompatible franchise schema');
 if(!s.settings||(!Number.isInteger(s.settings.controlledTeamId)&&typeof s.settings.controlledTeamId!=='string'))throw Error('Missing controlled team');
 for(const field of ['roster','contracts','draftPicks','prospects','history'])if(s[field]!==undefined&&!Array.isArray(s[field])&&(typeof s[field]!=='object'||s[field]===null))throw Error('Invalid '+field);
 return snapshot;
}
function verifyCompatibilityRoundtrip(snapshot){
 validateFranchise(snapshot);
 const before=JSON.stringify(snapshot);
 const reopened=verifyReopenedFile(packageSnapshot(snapshot),snapshot);
 validateFranchise(reopened);
 if(JSON.stringify(reopened)!==before||JSON.stringify(snapshot)!==before)throw Error('Franchise preservation mismatch');
 return reopened;
}
function rejectLegacyEnvelope(snapshot){
 if(snapshot&&snapshot.database===LEGACY_DB)throw Error('Legacy v5 requires explicit migration; no silent import');
 return validateFranchise(snapshot);
}
module.exports={EXPECTED_DB,LEGACY_DB,SCHEMA,validateFranchise,verifyCompatibilityRoundtrip,rejectLegacyEnvelope};
