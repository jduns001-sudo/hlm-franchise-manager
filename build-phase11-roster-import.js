'use strict';
const fs=require('node:fs'),path=require('node:path');
const entry='hlm-phase11-roster-import-entry.js',sources=new Map();
function add(file){
 if(sources.has(file))return;
 const code=fs.readFileSync(path.join(__dirname,file),'utf8');
 sources.set(file,code);
 for(const m of code.matchAll(/require\(['"]\.\/([^'"]+)['"]\)/g))add(m[1]+(m[1].endsWith('.js')?'':'.js'));
}
add(entry);
const modules=[...sources].map(([name,code])=>JSON.stringify(name)+':function(module,exports,require){\n'+code+'\n}').join(',\n');
const out='/* Generated Phase 11 import bundle */\n(function(global){\'use strict\';const modules={\n'+modules+'\n};const cache={};function load(id){if(!id.endsWith(\'.js\'))id+=\'.js\';if(cache[id])return cache[id].exports;if(!modules[id])throw Error(\'Missing module \'+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,function(p){return load(p.replace(/^\\.\\//,\'\'))});return module.exports;}global.HLMRosterImport=load(\''+entry+'\');})(window);\n';
fs.writeFileSync(path.join(__dirname,'hlm-phase11-roster-import.bundle.js'),out);
console.log('Built Phase 11 import bundle with '+sources.size+' modules');
