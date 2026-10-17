'use strict';
const {buildGMReviewBatchReport}=require('./hlm-phase11-gm-review-batch-report');
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
/** Render actual computed read-only evidence, not hardcoded preview text. */
function renderGMReviewReport(items){
 const report=buildGMReviewBatchReport(items);
 const entries=report.lines.map(line=>'<li>'+escapeHTML(line)+'</li>').join('');
 return '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Experimental GM review report</title><style>body{font:16px system-ui;max-width:40rem;margin:auto;padding:1rem}li{overflow-wrap:anywhere;margin:.5rem 0}</style>'+
 '<main><h1>GM evidence review</h1><p>Experimental read-only report. Production activation disabled. Human GM approval required.</p>'+
 '<ul aria-label="Computed GM review evidence">'+entries+'</ul><p>No gameplay action authorized. No save writes.</p></main></html>';
}
module.exports={renderGMReviewReport,escapeHTML};
