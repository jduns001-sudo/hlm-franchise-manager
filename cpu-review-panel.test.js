'use strict';
const assert=require('assert');
const {parseReviewExport,filterRows}=require('./cpu-review-panel');
const rows=parseReviewExport(JSON.stringify({kind:'cpu-review-export',rows:[
{id:'one',title:'Trade review',subtitle:'Blocked: pending',section:'Needs attention'},
{id:'two',title:'Contract review',subtitle:'Review',section:'Pending review'}
]}));
assert.strictEqual(rows.length,2);
assert.strictEqual(filterRows(rows,'trade','all','priority').length,1);
assert.strictEqual(filterRows(rows,'','Needs attention','priority').length,1);
assert.strictEqual(filterRows(rows,'','all','title')[0].id,'two');
assert.throws(()=>parseReviewExport('{}'));
assert.throws(()=>parseReviewExport(JSON.stringify({kind:'cpu-review-export',rows:[{id:1}]})));
assert.strictEqual(Object.isFrozen(rows[0]),true);
const pasted=JSON.stringify({kind:'cpu-review-export',rows:[{id:'demo',title:'Demo',section:'Pending review'}]});
assert.strictEqual(parseReviewExport(pasted)[0].id,'demo');
assert.strictEqual(filterRows(rows,'','all','priority').length,2);
console.log('Phase 9 Missions 406-410 browser usability regression tests passed.');
console.log('Phase 9 Missions 401-405 CPU browser review panel tests passed.');
