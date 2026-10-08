'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'cpu-review.html'),'utf8');
for(const id of ['download-audit-json','download-audit-csv'])assert.ok(html.includes('id="'+id+'" type="button" disabled'));
assert.ok(html.includes('HFMCPUAuditReports.exportReport(latest)'));
assert.ok(html.includes('HFMCPUAuditReports.exportCSV(latest)'));
assert.ok(html.includes('latest=result.audit'));
assert.ok(html.includes('URL.revokeObjectURL(url)'));
console.log('Phase 9 missions 526-540 download wiring checks passed');
