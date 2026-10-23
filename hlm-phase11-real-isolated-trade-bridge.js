'use strict';
// Test-only, loopback-bound bridge. No production save, network service, or settlement.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {createWorkspace}=require('./hlm-phase11-integrated-trade-workspace');
const {createGameStateEnvelope}=require('./hlm-game-state');
const PRODUCTION_KEY='hlm_front_office_v8';
const ISOLATED_KEY='mission-1464-ephemeral-trade-review';
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',name:'Alpha',teamId:1},{id:'b',name:'Bravo',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}],draftPicks:[{id:'p1',year:2028,round:1,originalTeamId:1,teamId:1}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 return s;
}
const proposal=Object.freeze({outgoingPlayerId:'a',incomingPlayerId:'b',picks:[{pickId:'p1',fromTeamId:1,toTeamId:2}]});
function createIsolatedBridge(options={}){
 let raw=JSON.stringify(options.fixture||fixture()),writes=0;
 const storage={
  getItem(key){if(key!==ISOLATED_KEY)throw Error('Nonisolated read rejected');return raw},
  setItem(){writes++;throw Error('Writes forbidden')}
 };
 const workspace=createWorkspace(storage,ISOLATED_KEY);
 function dispatch(action){
  if(action==='review')return workspace.review(proposal);
  if(action==='reload')return workspace.reload();
  if(['approve','decline','cancel'].includes(action))return workspace.decide(action);
  return {status:'blocked',code:'unsupported-action',saved:false,settlementAuthorized:false};
 }
 return Object.freeze({dispatch,inspect:()=>({raw,writes}),changeSource:v=>{raw=v},productionKey:PRODUCTION_KEY});
}
async function startServer(bridge=createIsolatedBridge()){
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-integrated-trade-workspace.html'),'utf8');
 const js=`window.HLMTradeWorkspace={review:()=>request('review'),decide:(action)=>request(action),reload:()=>request('reload')};async function request(action){const r=await fetch('/isolated-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});if(!r.ok)throw Error('Review unavailable');return r.json()}`;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; style-src 'unsafe-inline'");
  if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html.replace('<script>','<script>'+js+';'));return}
  if(req.method==='POST'&&req.url==='/isolated-review'){
   let body='';try{for await(const chunk of req){body+=chunk;if(body.length>256)throw Error('Request too large')}const parsed=JSON.parse(body);if(!parsed||typeof parsed.action!=='string')throw Error('Invalid action');const result=bridge.dispatch(parsed.action);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));}catch{res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'blocked',code:'invalid-request',saved:false,settlementAuthorized:false}))}return;
  }
  res.writeHead(404);res.end();
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 return {url:'http://127.0.0.1:'+server.address().port+'/',close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve())),bridge};
}
module.exports={createIsolatedBridge,startServer,fixture,proposal,ISOLATED_KEY};
