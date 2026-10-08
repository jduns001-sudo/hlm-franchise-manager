'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'cpu-review.html'),'utf8');
for(const name of ['cpu-legacy-audit.js','cpu-audit-reports.js','cpu-audit-trends.js','cpu-audit-alerts.js','cpu-audit-pipeline.js'])assert.ok(html.includes('src="./'+name+'"'),name+' missing');
for(const id of ['run-audit','audit-status','audit-report'])assert.ok(html.includes('id="'+id+'"'),id+' missing');
assert.ok(html.includes('HFMCPUAuditPipeline.pipeline(window.localStorage,previous)'));
assert.ok(html.includes('report.textContent=HFMCPUAuditPresentation.format(result,hadPrevious)'));
assert.ok(!html.includes('innerHTML=JSON.stringify'));
console.log('Phase 9 missions 511-525 browser wiring checks passed');
