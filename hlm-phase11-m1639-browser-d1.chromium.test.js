'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Miniflare}=require('miniflare');
const {createHandler}=require('./hlm-phase11-m1639-browser-d1-bridge');
const local=require('./hlm-phase11-m1637-local-atomic-trade');
const {createGameStateEnvelope}=require('./hlm-game-state');
const state=()=>createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'NYR'}],contracts:[{playerId:'p1',teamId:'BUF',aav:3000000}],finances:{buf:{teamId:'BUF',seasonId:2026,payroll:10000000,capLimit:20000000},nyr:{teamId:'NYR',seasonId:2026,payroll:12000000,capLimit:20000000}}});
const input={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},{fromTeamId:'NYR',toTeamId:'BUF',assets:[{type:'draft-pick',id:'d1',ownerTeamId:'NYR'}]}],playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true,transactionId:'tx-1639'};
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m1639-'));
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture")}}',d1Databases:{DB:'test-db'},d1Persist:path.join(dir,'d1')});
 const db=await mf.getD1Database('DB');
 await local.initialize(db,'slot','r1',state());
 const fixture={slot:'slot',expectedRevision:'r1',nextRevision:'r2',teamId:'BUF',input,decisionId:'decision-1639',cpuFixtureDecision:'accept'};
 let enabled=true, tamper=false;
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1639-browser-d1.html'),'utf8');
 const handler=createHandler({db,fixture,enabled:true});
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return}
   let body={};if(req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;body=JSON.parse(raw)}
   const result=enabled?await handler({method:req.method,path:req.url,body}):{status:403,body:{ok:false,saved:false,code:'disabled'}};
   res.writeHead(result.status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(result.body));
  }catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e)}))}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base);
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL'));
  await page.getByRole('button',{name:'Decline'}).click();
  assert.equal((await local.read(db,'slot')).revision,'r1','decline must not save');
  await page.reload();
  assert.equal(await page.getByRole('button',{name:'Approve reviewed trade'}).isEnabled(),true);
  const review=await page.evaluate(async()=>await (await fetch('/review')).json());
  assert.equal(review.ok,true);
  const altered=await page.evaluate(async r=>await(await fetch('/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'approve',proposalDigest:'tampered',revision:r.revision,cpuFixtureDecision:'accept'})})).json(),review);
  assert.equal(altered.saved,false);
  assert.equal((await local.read(db,'slot')).revision,'r1');
  const stale=await page.evaluate(async r=>await(await fetch('/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'approve',proposalDigest:r.proposalDigest,revision:'stale'})})).json(),review);
  assert.equal(stale.saved,false);
  await page.getByRole('button',{name:'Approve reviewed trade'}).click();
  await page.getByRole('status').getByText('Trade committed in isolated D1 fixture.').waitFor();
  const committed=await local.read(db,'slot');
  assert.equal(committed.revision,'r2');
  assert.equal(committed.state.universe.players.find(p=>p.id==='p1').teamId,'NYR');
  assert.equal(committed.state.assets.contracts.find(c=>c.playerId==='p1').teamId,'NYR');
  assert.equal(committed.state.finances.buf.payroll,7000000);
  assert.equal(committed.state.finances.nyr.payroll,15000000);
  assert.equal(committed.state.universe.draftPicks.find(p=>p.pickId==='d1').ownerTeamId,'BUF');
  const replay=await page.evaluate(async r=>await(await fetch('/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'approve',proposalDigest:r.proposalDigest,revision:r.revision})})).json(),review);
  assert.equal(replay.saved,false);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM m1637_consumed_decisions').first()).n,1);
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
  assert.equal(await page.getByRole('button',{name:'Approve reviewed trade'}).isDisabled(),true);
  assert.equal((await local.read(db,'slot')).revision,'r2');
  console.log('Mission 1639 real mobile browser to Miniflare D1 trade settlement PASS');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));await mf.dispose();fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
