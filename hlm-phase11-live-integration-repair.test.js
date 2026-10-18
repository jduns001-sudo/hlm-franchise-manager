'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('real app script boundary is valid HTML',()=>{
 const app=fs.readFileSync('app.html','utf8');
 assert.equal(app.includes('</script>'+String.fromCharCode(92)+'n<script>'),false,'literal backslash n must never appear between scripts');
 assert.ok(app.includes('hlm-phase11-frontoffice-roster-preview-ui.js"></script>\n<script>'));
 assert.ok(app.includes('HLMFrontOfficeRosterPreviewUI.mount(()=>db)'));
});
test('save guard and human consent remain intact',()=>{
 const app=fs.readFileSync('app.html','utf8'),ui=fs.readFileSync('hlm-phase11-frontoffice-roster-preview-ui.js','utf8');
 assert.ok(app.includes('HLM_PHASE11_SAVE_GUARD_OPT_IN!==true'));
 assert.ok(ui.includes("approve.addEventListener('click'"));
 assert.ok(ui.includes('humanApproved:true'));
 assert.doesNotMatch(ui,/localStorage|indexedDB|\.save\(/);
});
