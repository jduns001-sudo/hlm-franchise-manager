(function(root){
'use strict';
// Phase 9: strict, aggregate-only audit comparison export boundary.
// Never accepts player records, identifiers, or arbitrary CSV columns.
const integrity=(typeof module!=='undefined'&&module.exports)?require('./cpu-audit-integrity'):root.HFMCPUAuditIntegrity;
const fields=['teams','players','contracts','draftPicks','transactions','prospects'];
function toCSV(input){
 const v=integrity.validateComparison(input);
 return 'dataset,change\n'+fields.map(k=>k+','+v.changes[k]).join('\n')+'\nissues,'+v.issueDelta+'\n';
}
function fromCSV(input){
 if(typeof input!=='string'||input.length>2048)throw new TypeError('Invalid comparison CSV size');
 const lines=input.trimEnd().split(/\r?\n/);
 if(lines.length!==8||lines[0]!=='dataset,change')throw new TypeError('Invalid comparison CSV shape');
 const changes={};
 fields.forEach((key,i)=>{
  const match=lines[i+1].match(/^([A-Za-z]+),(-?(?:0|[1-9][0-9]*))$/);
  if(!match||match[1]!==key)throw new TypeError('Invalid comparison CSV field');
  const value=Number(match[2]);
  if(!Number.isSafeInteger(value))throw new TypeError('Invalid comparison CSV delta');
  changes[key]=value;
 });
 const issue=lines[7].match(/^issues,(-?(?:0|[1-9][0-9]*))$/);
 if(!issue||!Number.isSafeInteger(Number(issue[1])))throw new TypeError('Invalid comparison CSV issues');
 return integrity.validateComparison({kind:'cpu-audit-public-comparison',readOnly:true,changes,issueDelta:Number(issue[1])});
}
const api=Object.freeze({toCSV,fromCSV});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.HFMCPUAuditComparisonCSV=api;
})(typeof globalThis!=='undefined'?globalThis:this);
