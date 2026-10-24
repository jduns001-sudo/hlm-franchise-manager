'use strict';
/* Mission 1514: integration gate. Deliberately never authorizes settlement.
 * CPU advisory != authenticated consent; experimental atomic event != real trade.
 */
const {evaluate}=require('./hlm-phase11-m1513-cpu-trade-decision');
function reviewSettlementReadiness(state,input,options={}){
 const deny=(code,advisory=null)=>Object.freeze({ready:false,code,advisory,
  cpuConsentAuthenticated:false,gmApprovalVerified:false,realSettlementAdapterVerified:false,
  saved:false,settlementAuthorized:false});
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 const advisory=evaluate(state,input,options);
 if(!advisory.ok)return deny(advisory.code);
 if(advisory.decision!=='recommend-accept')return deny('cpu-advisory-declines',advisory);
 if(options.gmApproved!==true)return deny('gm-approval-required',advisory);
 // A caller-provided boolean is not independent CPU authority, nor a real atomic trade adapter.
 // Never return ready/authorized until these exist and are independently tested.
 return deny('authenticated-cpu-consent-and-real-atomic-settlement-unavailable',advisory);
}
module.exports={reviewSettlementReadiness};
