'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const SCOUT_ATTRIBUTES=Object.freeze(['current-ability-accuracy','potential-accuracy','region','league','position-specialization','knowledge']);
const SCOUT_PERSONALITIES=Object.freeze(['traditional','analytics','skill-focused','defensive']);
const SCOUT_REPORT_FIELDS=Object.freeze(['ranges','confidence','strengths','weaknesses','projection']);
const DRAFT_SYSTEM_CAPABILITIES=Object.freeze(['scouting-assignments','scouting-resources','prospect-exposure','international-prospects','multiple-rankings','draft-board-tags','interviews','combine','medical-evaluation','lottery','persistent-pick-ownership','draft-protections','draft-day-trades','cpu-drafting','risers','fallers','sleepers','busts','future-prospect-generation','prospect-stories']);
const CPU_DRAFT_FACTORS=Object.freeze(['needs','philosophy','scouting','personality','position','potential','development','risk']);
function fail(c,m){const e=new Error(m);e.code=c;throw e;}
function createDraftScoutingFoundation(state,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_DRAFT_SCOUTING_STATE','Valid GameState required.');
 const prospects=Object.freeze([...(state.universe?.prospects||[])]);
 return Object.freeze({kind:'draft-scouting-foundation',version:1,prospects,principles:Object.freeze({hiddenActualAbility:true,imperfectScoutingEstimates:true,multipleScoutsMayDisagree:true,highestOverallOnlyDrafting:false}),
  scoutAttributes:SCOUT_ATTRIBUTES,scoutPersonalities:SCOUT_PERSONALITIES,reportFields:SCOUT_REPORT_FIELDS,capabilities:DRAFT_SYSTEM_CAPABILITIES,cpuDraftFactors:CPU_DRAFT_FACTORS,
  rankings:Object.freeze(['league-media','organizational','ai-evaluation','user-draft-board']),draftBoardTags:Object.freeze(['Target','Untouchable','Rising','Falling','Need More Scouting']),
  actualAbilityExposedToTeam:false,scoutingPerformed:false,draftPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={SCOUT_ATTRIBUTES,SCOUT_PERSONALITIES,SCOUT_REPORT_FIELDS,DRAFT_SYSTEM_CAPABILITIES,CPU_DRAFT_FACTORS,createDraftScoutingFoundation};
