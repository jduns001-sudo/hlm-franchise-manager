'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const ORGANIZATION_PHILOSOPHIES=Object.freeze(['Win Now','Rebuild','Youth','Analytics','Veteran','Balanced','Financially Conservative','Aggressive']);
const OWNER_EXPECTATION_AREAS=Object.freeze(['winning','finances','development','attendance','organizational-direction']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function array(v){return Array.isArray(v)?v:[];}
function createOrganizationLeadershipSnapshot(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_ORGANIZATION_LEADERSHIP_GAME_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id)fail('ORGANIZATION_TEAM_REQUIRED','Permanent team ID required.');
 if(!state.universe.teams.some(t=>String(t.id)===id))fail('ORGANIZATION_TEAM_NOT_FOUND','Team not found.');
 const philosophy=options.philosophy??null;
 const ownerExpectations=Object.freeze(array(options.ownerExpectations).map(x=>Object.freeze({area:x.area??null,expectation:x.expectation??null,
  validArea:OWNER_EXPECTATION_AREAS.includes(x.area)})));
 const gmReputation=Object.freeze({...((options.gmReputation)||{})});
 const gmCareer=Object.freeze(array(options.gmCareer).map(x=>Object.freeze({...x})));
 const decisions=Object.freeze(array(options.decisionHistory).map(x=>Object.freeze({...x})));
 return Object.freeze({kind:'organization-leadership-snapshot',version:1,teamId:id,
  philosophy:Object.freeze({value:philosophy,valid:philosophy===null||ORGANIZATION_PHILOSOPHIES.includes(philosophy),allowed:ORGANIZATION_PHILOSOPHIES}),
  owner:Object.freeze({expectationAreas:OWNER_EXPECTATION_AREAS,expectations:ownerExpectations}),
  gm:Object.freeze({reputation:gmReputation,career:gmCareer,employmentImpactSupported:true,employmentDecisionPerformed:false}),
  decisionHistory:Object.freeze({records:decisions,appendOnlyRequired:true,persistencePerformed:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={ORGANIZATION_PHILOSOPHIES,OWNER_EXPECTATION_AREAS,createOrganizationLeadershipSnapshot};
