'use strict';
/* Mission 1527: explicit experimental browser adapter backed by persisted
 * IndexedDB source. No Node require, no synthetic settlement, no production.
 * CPU policy remains advisory and cannot grant authenticated consent.
 */
(function(root){
 const deny=code=>({ok:false,code,saved:false,cpuConsentAuthenticated:false,settlementAuthorized:false});
 function open(name){return new Promise((resolve,reject)=>{
  const request=root.indexedDB.open(name,1);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('db-open'));
  request.onupgradeneeded=()=>reject(Error('uninitialized-db'));
 });}
 async function read(name){
  const db=await open(name);
  try{return await new Promise((resolve,reject)=>{
   if(!db.objectStoreNames.contains('records')){reject(Error('missing-records'));return}
   const tx=db.transaction('records','readonly'),store=tx.objectStore('records');
   let game=null,ledger=null;
   store.get('game').onsuccess=e=>{game=e.target.result??null};
   store.get('ledger').onsuccess=e=>{ledger=e.target.result??null};
   tx.oncomplete=()=>resolve({game,ledger});
   tx.onerror=()=>reject(tx.error||Error('read-failed'));
  })}finally{db.close()}
 }
 function connect(options={}){
  if(options.experimentalEnabled!==true)return deny('experiment-disabled');
  const name=options.experimentalDatabaseName;
  if(typeof name!=='string'||!/^hlm-[a-zA-Z0-9_-]+$/.test(name))return deny('isolated-database-required');
  const host={
   async review(input){
    try{
     if(!input||typeof input.outgoingPlayerId!=='string'||typeof input.incomingPlayerId!=='string'||
      !input.outgoingPlayerId.trim()||!input.incomingPlayerId.trim()||
      input.outgoingPlayerId===input.incomingPlayerId)return deny('invalid-proposal');
     const {game,ledger}=await read(name);
     if(!game||!ledger)return deny('persisted-source-required');
     const revision=game.meta?.revision;
     if(!Number.isSafeInteger(revision)||revision<1||ledger.revision!==revision)return deny('stale-source');
     if(game.meta?.controlledTeamId==null)return deny('missing-controlled-team');
     const players=game.universe?.players,contracts=game.assets?.contracts;
     if(!Array.isArray(players)||!Array.isArray(contracts))return deny('missing-source-records');
     const selected=[];
     for(const id of [input.outgoingPlayerId,input.incomingPlayerId]){
      const matches=players.filter(p=>String(p.id)===id),active=contracts.filter(c=>String(c.playerId)===id&&c.status==='active');
      if(matches.length!==1||active.length!==1||String(matches[0].teamId)!==String(active[0].teamId))
       return deny('source-ownership-or-contract-mismatch');
      selected.push({player:matches[0],contract:active[0]});
     }
     if(String(selected[0].player.teamId)!==String(game.meta.controlledTeamId)||
        String(selected[0].player.teamId)===String(selected[1].player.teamId))
      return deny('invalid-trade-teams');
     // Source-backed financial review mirrors the strict read-only eligibility
     // requirements. It does not replace the authoritative Node evaluator.
     const cap=game.finances?.teamCapLimits,teamA=String(selected[0].player.teamId),
      teamB=String(selected[1].player.teamId);
     const active=contracts.filter(x=>x.status==='active');
     const validMoney=x=>typeof x.aav==='number'&&Number.isFinite(x.aav)&&x.aav>=0;
     let financial={eligible:false,reason:'source-financial-evidence-unavailable'};
     if(cap&&Number.isFinite(cap[teamA])&&Number.isFinite(cap[teamB])&&
        active.filter(x=>[teamA,teamB].includes(String(x.teamId))).every(validMoney)&&selected.every(x=>validMoney(x.contract))){
      const payroll=id=>active.filter(x=>String(x.teamId)===id).reduce((sum,x)=>sum+x.aav,0);
      const afterA=payroll(teamA)-selected[0].contract.aav+selected[1].contract.aav;
      const afterB=payroll(teamB)-selected[1].contract.aav+selected[0].contract.aav;
      financial=afterA<=cap[teamA]&&afterB<=cap[teamB]
       ?{eligible:true,reason:'source-cap-check-passed-review-only',projectedPayroll:{[teamA]:afterA,[teamB]:afterB}}
       :{eligible:false,reason:'verified-salary-cap-exceeded'};
     }
     // Browser mirror of the existing deterministic CPU AAV policy (M1513).
     // Recommendation is advisory only, never authenticated CPU consent.
     const cpuDecision=selected.every(x=>validMoney(x.contract))
      ?(selected[0].contract.aav<=selected[1].contract.aav?'recommend-accept':'recommend-decline')
      :'unavailable';
     const cpuPolicy=cpuDecision==='unavailable'?'source-contract-aav-unavailable':'incoming-team-aav-nonincreasing-v1';
     // Mirror M1445 read-only restriction and equal-size roster checks.
     // Unknown permissions, team identities, limits or statuses fail closed.
     const teams=game.universe?.teams,limits=game.extensions?.tradeRosterLimits;
     const teamExists=id=>Array.isArray(teams)&&teams.some(t=>String(t.id)===id);
     const allowed=selected.every(x=>x.contract.tradePermission==='allowed'&&
      x.player.status!=='retired'&&x.player.status!=='suspended');
     const limitOk=limits&&[teamA,teamB].every(id=>Number.isSafeInteger(limits[id])&&
      players.filter(p=>String(p.teamId)===id).length<=limits[id]);
     const restrictions=teamExists(teamA)&&teamExists(teamB)&&allowed&&limitOk
      ?{eligible:true,reason:'source-restrictions-passed-review-only'}
      :{eligible:false,reason:'source-restrictions-or-roster-limits-unverified'};
     return {ok:true,revision,cpuDecision,cpuPolicy,
      financial,
      restrictions,
      cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false};
    }catch{return deny('isolated-storage-error')}
   },
   async settle(){return deny('settlement-not-connected')}
  };
  root.HLMTradeReviewHost=Object.freeze(host);
  return {ok:true,code:'persisted-read-only-host-connected',saved:false,settlementAuthorized:false};
 }
 root.HLMRealSourceTradeReview=Object.freeze({connect});
})(typeof window!=='undefined'?window:globalThis);
