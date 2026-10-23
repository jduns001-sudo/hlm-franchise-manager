'use strict';
const {inspect,createSession}=require('./hlm-phase11-integrated-player-pick-trade');
function createWorkspace(storage,key){
 const session=createSession(storage,key);
 let current=null;
 const deny=code=>Object.freeze({status:'blocked',code,saved:false,settlementAuthorized:false});
 function reload(){current=null;session.reload();return deny('review-cleared')}
 function review(input){
  current=null;
  const raw=storage.getItem(key);
  if(!raw)return deny('missing-save');
  const source=JSON.parse(raw);
  const result=session.review(input);
  if(result.status!=='integrated-player-pick-review-only')return result;
  // Source-backed readable names and contract AAV; never infer absent fields.
  const players=source.universe.players,contracts=source.assets.contracts;
  const player=id=>{
   const matches=players.filter(p=>String(p.id)===id);
   const active=contracts.filter(c=>String(c.playerId)===id&&c.status==='active');
   if(matches.length!==1||active.length!==1)throw Error('Ambiguous player or contract');
   return Object.freeze({id,name:typeof matches[0].name==='string'&&matches[0].name.trim()?matches[0].name:null,teamId:String(matches[0].teamId),aav:active[0].aav,tradePermission:active[0].tradePermission});
  };
  const summary=Object.freeze({status:'review-only',outgoing:player(result.players.outgoingPlayerId),incoming:player(result.players.incomingPlayerId),picks:result.picks,financialReviewed:result.financialReviewed,restrictionsReviewed:result.restrictionsReviewed,gmApproved:false,independentlyAuthenticated:false,saved:false,settlementAuthorized:false,experimental:true});
  current=summary;return summary;
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM decision required');
  if(!current)return deny('review-required');
  current=null;
  return session.decide(action);
 }
 return Object.freeze({review,decide,reload});
}
module.exports={createWorkspace};
