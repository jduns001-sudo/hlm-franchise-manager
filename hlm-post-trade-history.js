'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const POST_TRADE_EFFECT_AREAS=Object.freeze(['rosters','contracts','cap','picks','morale','chemistry','relationships','ai-memory','news','history']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createPostTradeConsequences(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_POST_TRADE_STATE','Valid GameState required.');
 const effects={};for(const area of POST_TRADE_EFFECT_AREAS)effects[area]=input.effects?.[area]??null;
 return Object.freeze({kind:'post-trade-consequences',version:1,tradeId:input.tradeId??null,areas:POST_TRADE_EFFECT_AREAS,effects:Object.freeze(effects),
  applied:false,sourceStateMutated:false,persistencePerformed:false});
}
function createTradeTreeNode(input={}){
 return Object.freeze({kind:'trade-tree-node',version:1,tradeId:input.tradeId??null,assetId:input.assetId??null,assetType:input.assetType??null,
  parentTradeId:input.parentTradeId??null,parentAssetId:input.parentAssetId??null,nextTradeIds:Object.freeze([...(input.nextTradeIds||[])]),historyTraceReady:true});
}
function createTradeTree(input={}){
 const nodes=Object.freeze((input.nodes||[]).map(createTradeTreeNode));
 return Object.freeze({kind:'trade-tree',version:1,rootTradeId:input.rootTradeId??null,nodes,traceAcrossMultipleTransactions:true,resolutionPerformed:false});
}
function createLongTermTradeRetrospective(input={}){
 return Object.freeze({kind:'long-term-trade-retrospective',version:1,tradeId:input.tradeId??null,actualOutcomes:Object.freeze({...input.actualOutcomes}),
  yearsLaterAnalysisSupported:true,simpleLetterGradeUsed:false,analysisPerformed:false,conclusion:null});
}
module.exports={POST_TRADE_EFFECT_AREAS,createPostTradeConsequences,createTradeTreeNode,createTradeTree,createLongTermTradeRetrospective};
