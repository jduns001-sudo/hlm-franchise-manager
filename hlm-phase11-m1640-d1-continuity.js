'use strict';
// Mission 1640: local-only sequential fixture; never deploy or treat synthetic CPU consent as authenticated.
const local=require('./hlm-phase11-m1637-local-atomic-trade');
const {createHandler}=require('./hlm-phase11-m1639-browser-d1-bridge');
function secondFixture(first){
 const legs=first.input.legs.map(leg=>({
   fromTeamId:leg.toTeamId,toTeamId:leg.fromTeamId,
   assets:leg.assets.map(asset=>({...asset,ownerTeamId:leg.toTeamId}))
 }));
 return {...first,expectedRevision:first.nextRevision,nextRevision:'r3',
   decisionId:first.decisionId+'-second',teamId:first.input.teamIds.find(id=>id!==first.teamId),
   input:{...first.input,legs,transactionId:first.input.transactionId+'-second'}};
}
function createContinuityHandler({db,fixture,enabled=false}){
 const second=secondFixture(fixture);
 const firstHandler=createHandler({db,fixture,enabled});
 const secondHandler=createHandler({db,fixture:second,enabled});
 return async function handle(request){
   if(!enabled)return firstHandler(request);
   const saved=await local.read(db,fixture.slot);
   if(!saved)return {status:409,body:{ok:false,saved:false,code:'missing-local-fixture',experimental:true,productionTouched:false}};
   return (saved.revision===fixture.expectedRevision?firstHandler:secondHandler)(request);
 };
}
module.exports={secondFixture,createContinuityHandler};
