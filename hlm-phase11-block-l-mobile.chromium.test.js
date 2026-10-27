"use strict";
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const path=require("node:path");
const fs=require("node:fs");
const http=require("node:http");

(async()=>{
  const files=new Set(["hlm-phase11-block-l-browser-adapter.js","hlm-phase11-block-l-service-transport.js","hlm-phase11-isolated-single-game.html"]);
  const server=http.createServer((req,res)=>{
    const name=decodeURIComponent(req.url.split("?")[0]).slice(1);
    if(!files.has(name)){res.writeHead(404);res.end();return;}
    fs.readFile(path.join(__dirname,name),(err,data)=>{
      if(err){res.writeHead(404);res.end();return;}
      res.setHeader("Content-Type",name.endsWith(".html")?"text/html":"text/javascript");
      res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    await page.goto("http://127.0.0.1:"+server.address().port+"/hlm-phase11-block-l-browser-adapter.js");
    await page.addScriptTag({url:"http://127.0.0.1:"+server.address().port+"/hlm-phase11-block-l-browser-adapter.js"});
    const result=await page.evaluate(async()=>{
      const factory=window.HLMExperimentalGMReviewAdapter.createGMReviewAdapter;
      const calls=[];
      const disabled=factory({transport:async()=>calls.push("disabled")});
      let rejected=false;
      try{await disabled.review({franchise:"SYNTHETIC-F",revision:1,seed:17});}catch(e){rejected=/disabled/.test(e.message);}
      if(!rejected||calls.length)throw Error("default-off violation");
      const adapter=factory({enabled:true,identity:async()=>({authenticated:true,gm:"trusted-gm"}),
        transport:async command=>{calls.push(command);return {committed:false,status:command.action==="decline"?"declined":"pending",review_id:"R1"};}});
      const base={franchise:"SYNTHETIC-F",revision:1,seed:17,review_id:"R1",decision_id:"SYNTHETIC-DAY-18"};
      await adapter.review({...base,gm:"spoof",action:"approve"});
      await adapter.decline(base);
      await adapter.recover(base);
      await adapter.approve(base);
      if(calls.length!==4||calls.some(c=>c.gm!=="trusted-gm"))throw Error("GM identity spoof");
      if(calls.map(c=>c.action).join(",")!=="review,decline,recover,approve")throw Error("action sequence");
      return {actions:calls.length,viewportOk:document.documentElement.scrollWidth<=innerWidth};
    });
    assert.deepEqual(result,{actions:4,viewportOk:true});
    await page.goto("http://127.0.0.1:"+server.address().port+"/hlm-phase11-isolated-single-game.html");
    for(const selector of ["#gm-workspace-review","#gm-workspace-approve","#gm-workspace-decline","#gm-workspace-day-confirm"]){
      assert.equal(await page.locator(selector).count(),1,selector+" missing");
      assert.equal(await page.locator(selector).isDisabled(),true,selector+" unexpectedly enabled without franchise");
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log("Block L mobile Chromium adapter and isolated gameplay default-off controls passed");
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
