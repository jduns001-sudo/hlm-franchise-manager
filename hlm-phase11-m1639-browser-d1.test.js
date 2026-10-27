'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('./hlm-phase11-m1639-browser-d1-bridge');
test('default off and no browser-controlled CPU evidence',async()=>{
 const db={prepare(){throw Error('must not touch D1')}};
 const fixture={slot:'s'};
 const handle=createHandler({db,fixture});
 assert.equal((await handle({method:'POST',path:'/decision',body:{action:'approve'}})).body.code,'disabled-by-default');
});
test('decline is no-save even with enabled fixture',async()=>{
 const db={prepare(){throw Error('must not touch D1')}};
 const handle=createHandler({db,fixture:{slot:'s'},enabled:true});
 assert.equal((await handle({method:'POST',path:'/decision',body:{action:'decline'}})).body.saved,false);
});
