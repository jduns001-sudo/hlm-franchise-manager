'use strict';
/* Read-only assessment: synthetic legacy mapping, not a production migrator. */
const CURRENT='hlm_front_office_v8',LEGACY='hlm_front_office_v5';
const fields=['roster','contracts','draftPicks','prospects','history'];
function assess(legacy){
 const errors=[],warnings=[];
 if(!legacy||typeof legacy!=='object'||Array.isArray(legacy))return {compatible:false,errors:['Invalid legacy record'],warnings};
 if(legacy.schema!==undefined&&legacy.schema!==5&&legacy.schema!==7)errors.push('Unsupported legacy schema');
 if(!legacy.settings||(!Number.isInteger(legacy.settings.controlledTeamId)&&typeof legacy.settings.controlledTeamId!=='string'))errors.push('Controlled team missing');
 const ids=new Set();
 for(const field of fields){
  const value=legacy[field];
  if(value===undefined){warnings.push('Missing '+field);continue}
  if(!Array.isArray(value)){errors.push('Invalid '+field);continue}
  if(field==='roster'||field==='prospects'){
   for(const item of value){if(!item||item.id===undefined||item.id===null){errors.push('Missing player id in '+field);continue}
    const key=String(item.id);if(ids.has(key))errors.push('Duplicate player id '+key);ids.add(key)}
  }
 }
 if(Array.isArray(legacy.roster))for(const p of legacy.roster)if(p&&p.teamId!==undefined&&p.teamId!==legacy.settings?.controlledTeamId)warnings.push('Other-team roster member '+p.id);
 if(Array.isArray(legacy.draftPicks))for(const p of legacy.draftPicks)if(!p||p.ownerId===undefined)errors.push('Draft pick missing owner');
 if(Array.isArray(legacy.contracts))for(const c of legacy.contracts)if(!c||c.playerId===undefined)errors.push('Contract missing player reference');
 return {compatible:errors.length===0,errors,warnings,source:LEGACY,target:CURRENT,mode:'assessment-only'};
}
function roundtripFixture(record){const before=JSON.stringify(record),after=JSON.parse(before);if(JSON.stringify(after)!==before)throw Error('JSON fixture preservation failed');return after}
module.exports={assess,roundtripFixture,fields,LEGACY,CURRENT};
