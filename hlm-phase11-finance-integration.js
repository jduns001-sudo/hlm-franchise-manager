(function(root){'use strict';
const finance=typeof module!=='undefined'&&module.exports?require('./hlm-phase11-finance-engine.js'):root.HLMPhase11Finance;
function integer(v,label){if(!Number.isSafeInteger(v)||v<0)throw Error('Invalid '+label);return v}
function computeSeason(team,calendar){if(!team||!calendar)throw Error('Team and calendar required');
 const homeGames=integer(calendar.homeGamesPlayed,'homeGamesPlayed'),remaining=integer(calendar.remainingHomeGames,'remainingHomeGames');
 const base=finance.evaluate(team);
 const earnedTickets=base.ticketRevenue*homeGames;
 if(!Number.isSafeInteger(earnedTickets))throw Error('Season revenue overflow');
 const revenue=earnedTickets+base.revenue-base.ticketRevenue;
 if(!Number.isSafeInteger(revenue))throw Error('Season revenue overflow');
 const profit=revenue-base.expenses;
 if(!Number.isSafeInteger(profit))throw Error('Season profit overflow');
 const forecast=finance.projectSeason(team,remaining);
 return Object.freeze({homeGamesPlayed:homeGames,remainingHomeGames:remaining,earnedTickets,revenue,expenses:base.expenses,profit,forecastTicketRevenue:forecast.projectedTicketRevenue,projectedRevenue:revenue+forecast.projectedTicketRevenue,capSpace:base.capSpace,ownerBudgetRemaining:base.ownerBudgetRemaining,overCap:base.overCap,overBudget:base.overBudget});
}
function evaluateDecision(team,decision){if(!decision||!['sign','release'].includes(decision.type))throw Error('Unsupported financial decision');
 const salary=integer(decision.annualSalary,'annualSalary');
 const payroll=integer(team.payroll,'payroll');
 const nextPayroll=decision.type==='sign'?payroll+salary:payroll-salary;
 if(!Number.isSafeInteger(nextPayroll)||nextPayroll<0)throw Error('Invalid resulting payroll');
 const next={...team,payroll:nextPayroll},result=finance.evaluate(next);
 return Object.freeze({allowed:!result.overCap&&!result.overBudget,nextPayroll,capSpace:result.capSpace,budgetRemaining:result.ownerBudgetRemaining,reasons:[...(result.overCap?['SALARY_CAP_EXCEEDED']:[]),...(result.overBudget?['OWNER_BUDGET_EXCEEDED']:[])]});
}
function cpuRecommendation(team){const f=finance.evaluate(team);return Object.freeze({priority:f.overCap?'REDUCE_PAYROLL':f.overBudget?'REDUCE_EXPENSES':f.capSpace>0?'EVALUATE_ROSTER_UPGRADE':'MAINTAIN_ROSTER',capSpace:f.capSpace,ownerBudgetRemaining:f.ownerBudgetRemaining});}
function dashboard(team,calendar){const s=computeSeason(team,calendar),cpu=cpuRecommendation(team);return Object.freeze({heading:'Franchise Finances',cards:[{label:'Revenue',value:s.revenue},{label:'Expenses',value:s.expenses},{label:'Profit',value:s.profit},{label:'Cap Space',value:s.capSpace},{label:'Owner Budget Remaining',value:s.ownerBudgetRemaining},{label:'Projected Revenue',value:s.projectedRevenue}],cpuPriority:cpu.priority,warning:s.overCap||s.overBudget});}
const api=Object.freeze({computeSeason,evaluateDecision,cpuRecommendation,dashboard});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HLMPhase11FinanceIntegration=api;
})(typeof globalThis!=='undefined'?globalThis:this);
