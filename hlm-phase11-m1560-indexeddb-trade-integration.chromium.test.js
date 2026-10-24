'use strict';
/* Direct mobile-browser acceptance for the NEW M1560 facade, not just M1522. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const modules=new Map();
function collect(name){
 if(modules.has(name))return;
 const code=fs.readFileSync(path.join(__dirname,name+'.js'),'utf8');
 modules.set(name,code);
 for(const match of code.matchAll(/require\(['"]\.\/([^'"]+)['"]\)/g))collect(match[1].replace(/\.js$/,''));
}
collect('hlm-phase11-m1560-indexeddb-trade-integration');
const bundle='(function(root){const modules=Object.create(null),cache=Object.create(null);'+
 'function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(!modules[key])throw Error(\'unknown module \'+key);if(!cache[key]){const m={exports:{}};cache[key]=m;modules[key](m,m.exports,require)}return cache[key].exports;}'+
 [...modules].map(([name,code])=>'modules['+JSON.stringify(name)+']=function(module,exports,require){\n'+code+'\n};').join('\n')+
 'root.HLM1560=require(\'./hlm-phase11-m1560-indexeddb-trade-integration\');root.HLM1516=require(\'./hlm-phase11-m1516-atomic-isolated-state-persistence\');})(globalThis);';
function source(){return {schemaVersion:1,meta:{revision:4,controlledTeamId:'A'},universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
(async()=>{const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:'+server.address().port);const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));await page.addScriptTag({content:bundle});assert.equal(await page.evaluate(()=>typeof globalThis.HLM1560),'object','bundle must expose M1560: '+pageErrors.join('; '));
 const db='hlm-phase11-m1560-experimental-'+process.pid;
 const result=await page.evaluate(async ({state,db})=>{const input={outgoingPlayerId:'pA',incomingPlayerId:'pB',gmApproved:true,expectedGameRevision:4},options={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,eventId:'m1560_direct',experimentalDatabaseName:db};localStorage.setItem('hlm_front_office_v8','production-untouched');const before=JSON.stringify(state);const results={};
 for(const [key,change] of [['disabled',{experimentalEnabled:false}],['cancel',{cancelled:true}],['decline',{declined:true}],['production',{realTradeSettlement:true}],['untrusted',{syntheticTestAuthorization:false}]])results[key]=await HLM1560.settleSyntheticTradeWithIndexedDb(state,input,{...options,...change});
 results.uninitialized=await HLM1560.settleSyntheticTradeWithIndexedDb(state,input,options);
 results.store=await HLM1516.read(db);
 results.production=localStorage.getItem('hlm_front_office_v8');results.sourceUnchanged=JSON.stringify(state)===before;return results;},{state:source(),db});
 for(const key of ['disabled','cancel','decline','production','untrusted','uninitialized']){assert.equal(result[key].saved,false,key);assert.equal(result[key].settlementAuthorized,false,key)}
 assert.equal(result.uninitialized.code,'uninitialized-experimental-store');assert.equal(result.store.game,null);assert.equal(result.store.ledger,null);assert.equal(result.production,'production-untouched');assert.equal(result.sourceUnchanged,true);
 console.log('M1560 direct mobile facade: cancel, decline, production, uninitialized store, no-save passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
