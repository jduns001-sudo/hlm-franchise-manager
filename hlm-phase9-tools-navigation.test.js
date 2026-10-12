'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function navigate(search){let destination=null;vm.runInNewContext(script,{location:{search,replace(url){destination=url;}},URLSearchParams});return destination;}
assert.equal(navigate(''),'./app.html');
assert.equal(navigate('?tools=0'),'./app.html');
assert.equal(navigate('?tools=1'),null);
assert.match(html,/href="\.\/phase9-diagnostics\.html"/);
assert.match(html,/href="\.\/app\.html"/);
console.log('Mission 558 opt-in tools navigation tests passed');
