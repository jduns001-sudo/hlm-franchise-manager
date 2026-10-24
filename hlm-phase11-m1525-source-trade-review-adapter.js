'use strict';
/* Mission 1525: read-only persisted experimental review host.
 * This adapter never settles trades, authenticates CPU consent or writes saves.
 */
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {decide}=require('./hlm-phase11-m1519-cpu-authority-boundary');
const {review}=require('./hlm-phase11-m1517-guarded-trade-integration');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,cpuConsentAuthenticated:false});
function createHost(options={}){
 const database=options.experimentalDatabaseName;
 return Object.freeze({
  async review(input){
   if(options.experimentalEnabled!==true)return deny('experiment-disabled');
   if(typeof database!=='string'||!database.startsWith('hlm-'))return deny('isolated-database-required');
   if(!input||typeof input.outgoingPlayerId!=='string'||typeof input.incomingPlayerId!=='string'||
      !input.outgoingPlayerId.trim()||!input.incomingPlayerId.trim()||
      input.outgoingPlayerId===input.incomingPlayerId)return deny('invalid-proposal');
   try{
    const persisted=await store.read(database),state=persisted.game,ledger=persisted.ledger;
    if(!state||!ledger)return deny('persisted-source-required');
    if(validateGameStateEnvelope(state).valid!==true)return deny('invalid-source-state');
    const revision=state.meta?.revision;
    if(!Number.isSafeInteger(revision)||revision<1||ledger.revision!==revision)
     return deny('stale-persisted-revision');
    const flags={experimentalEnabled:true};
    const cpu=decide(state,input,flags);
    if(!cpu.ok)return deny(cpu.code);
    const staged=review(state,input,{...flags,gmApproved:true});
    if(!staged.ok)return deny(staged.code);
    if(staged.expectedRevision!==revision)return deny('revision-changed');
    return Object.freeze({ok:true,code:'persisted-review-only',revision,
      cpuDecision:cpu.cpuDecision,financial:{eligible:true,sourceValidated:true},
      restrictions:{eligible:true,sourceValidated:true},
      cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false});
   }catch{return deny('isolated-storage-error')}
  },
  async settle(){return deny('settlement-not-connected')}
 });
}
module.exports={createHost};
