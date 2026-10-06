'use strict';
const PRIORITIES=Object.freeze(['critical','important','informational','background']);
const BEHAVIORS=Object.freeze(['interrupt','notify','background']);
const DEFAULTS=Object.freeze({critical:'interrupt',important:'interrupt',informational:'notify',background:'background'});
function ruleError(m){const e=new Error(m);e.code='INVALID_SIMULATION_STOP_RULES';return e;}
function createSimulationStopRules(input={}){
 const source=input.behaviors||{};const behaviors={};
 for(const priority of PRIORITIES){const value=source[priority]||DEFAULTS[priority];if(!BEHAVIORS.includes(value))throw ruleError('Invalid stop behavior.');behaviors[priority]=value;}
 return Object.freeze({kind:'simulation-stop-rules',version:1,behaviors:Object.freeze(behaviors)});
}
function resolveSimulationEventBehavior(rules,priority){
 if(!rules||rules.kind!=='simulation-stop-rules'||rules.version!==1||!PRIORITIES.includes(priority))throw ruleError('Valid stop rules and event priority required.');
 return rules.behaviors[priority];
}
module.exports={SIMULATION_EVENT_PRIORITIES:PRIORITIES,SIMULATION_STOP_BEHAVIORS:BEHAVIORS,createSimulationStopRules,resolveSimulationEventBehavior};