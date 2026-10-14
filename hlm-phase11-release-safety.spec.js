'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('production entrypoint and mobile workbench do not expose an enabled roster cutover',async()=>{
 const app=fs.readFileSync('app.html','utf8'),workbench=fs.readFileSync('phase11-import-workbench.html','utf8'),preview=fs.readFileSync('hlm-phase11-mobile-activation-safety.js','utf8'),activation=fs.readFileSync('hlm-phase11-explicit-activation.js','utf8');
 expect(app).not.toContain('HLMPhase11ExplicitActivation.create(');
 expect(workbench).not.toContain('hlm-phase11-explicit-activation.js');
 expect(preview).toContain('const PROD_ENABLED=false');
 expect(activation).toContain('enabled=false');
 expect(activation).toContain('Final roster candidate changed before commit');
});
