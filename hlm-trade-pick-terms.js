'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const PICK_PROTECTION_TYPES=Object.freeze(['top-10','top-5','lottery','other']);
const PICK_SWAP_RIGHTS=Object.freeze(['better','worse']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function team(state,id){return state.universe.teams.some(t=>String(t.id)===String(id));}
function pick(state,id){return state.assets.draftPicks.find(p=>String(p.id??p.pickId)===String(id));}
function createSalaryRetention(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_RETENTION_STATE','Valid GameState required.');
 if(!team(state,input.originalTeamId))fail('RETENTION_ORIGINAL_TEAM_NOT_FOUND','Original organization required.');
 return Object.freeze({kind:'salary-retention',version:1,playerId:input.playerId??null,originalTeamId:String(input.originalTeamId),amount:input.amount??null,term:input.term??null,
  attachedToOriginalOrganization:true,calculationPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
function createConditionalPickTerms(state,pickId,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_CONDITIONAL_PICK_STATE','Valid GameState required.');if(!pick(state,pickId))fail('CONDITIONAL_PICK_NOT_FOUND','Persistent DraftPick required.');
 return Object.freeze({kind:'conditional-pick-terms',version:1,pickId:String(pickId),condition:input.condition??null,evaluation:Object.freeze({due:input.due??null,performed:false,outcome:null}),
  persistentDraftPickRequired:true,sourceStateMutated:false,persistencePerformed:false});
}
function createPickProtection(state,pickId,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PICK_PROTECTION_STATE','Valid GameState required.');if(!pick(state,pickId))fail('PROTECTED_PICK_NOT_FOUND','DraftPick required.');
 const type=input.type??null;if(type!==null&&!PICK_PROTECTION_TYPES.includes(type))fail('UNSUPPORTED_PICK_PROTECTION','Unsupported protection type.');
 return Object.freeze({kind:'pick-protection',version:1,pickId:String(pickId),type,terms:input.terms??null,resolutionPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
function createPickSwapRight(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PICK_SWAP_STATE','Valid GameState required.');const ids=input.pickIds||[];if(ids.length<2||ids.some(id=>!pick(state,id)))fail('PICK_SWAP_PICKS_REQUIRED','At least two valid DraftPicks required.');
 const right=input.right??null;if(!PICK_SWAP_RIGHTS.includes(right))fail('PICK_SWAP_RIGHT_REQUIRED','Better or worse right required.');
 return Object.freeze({kind:'pick-swap-right',version:1,pickIds:Object.freeze([...ids].map(String)),right,resolutionPerformed:false,selectedPickId:null,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={PICK_PROTECTION_TYPES,PICK_SWAP_RIGHTS,createSalaryRetention,createConditionalPickTerms,createPickProtection,createPickSwapRight};
