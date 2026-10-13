'use strict';
const fs=require('node:fs');
const path=require('node:path');
const entry='hlm-phase10-roster-lab-entry.js';
const sources=new Map();
function add(file){
 if(sources.has(file))return;
 const content=fs.readFileSync(path.join(__dirname,file),'utf8');
 sources.set(file,content);
 for(const m of content.matchAll(/require\(['"]\.\/([^'"]+)['"]\)/g)){
  const dep=m[1]+(m[1].endsWith('.js')?'':'.js');
  add(dep);
 }
}
add(entry);
const entries=[...sources].map(([name,code])=>JSON.stringify(name)+':function(module,exports,require){\n'+code+'\n}').join(',\n');
const output='/* Generated roster lab browser bundle */\n(function(global){\'use strict\';const modules={\n'+entries+'\n};const cache={};function load(id){if(!id.endsWith(\'.js\'))id+=\'.js\';if(cache[id])return cache[id].exports;if(!modules[id])throw Error(\'Missing module \'+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,function(p){return load(p.replace(/^\\.\\//,\'\'))});return module.exports;}global.HLMRosterLab=load(\''+entry+'\');})(window);\n';
fs.writeFileSync(path.join(__dirname,'hlm-phase10-roster-lab.bundle.js'),output);
console.log('Built roster lab bundle with '+sources.size+' modules');
