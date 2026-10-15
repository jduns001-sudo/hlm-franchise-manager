'use strict';
const {previewImportedRosterSeason}=require('./hlm-phase11-real-roster-multiday-preview');
/** Browser-facing, isolated read-only franchise preview adapter. */
function createSeasonPreviewWorkbench({enabled=false}={}){
 if(enabled!==true)throw Error('Explicit experimental workbench opt-in required');
 let last=null;
 return Object.freeze({
  preview(legacy,options){
   last=null;
   const result=previewImportedRosterSeason(legacy,{...options,experimental:true});
   last=result;
   return {advancedDays:result.advancedDays,blocked:JSON.parse(JSON.stringify(result.blocked)),days:JSON.parse(JSON.stringify(result.days||[])),summary:JSON.parse(JSON.stringify(result.summary)),official:false,persistencePerformed:false};
  },
  inspect(){return last?JSON.parse(JSON.stringify(last)):null},
  clear(){last=null;return true},
  save(){throw Error('Read-only workbench cannot save or activate production state')}
 });
}
module.exports={createSeasonPreviewWorkbench};
