(function(root){'use strict';
/* Pure, opt-in financial model. Does not access browser storage or mutate franchise saves. */
function money(value,label){if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid nonnegative integer '+label);return value}
function signed(value,label){if(!Number.isSafeInteger(value))throw Error('Invalid integer '+label);return value}
function add(a,b){const n=a+b;if(!Number.isSafeInteger(n))throw Error('Financial integer overflow');return n}
function sum(values){return values.reduce((a,b)=>add(a,b),0)}
function evaluate(input){
 if(!input||typeof input!=='object')throw Error('Financial input required');
 const cap=money(input.salaryCap,'salaryCap'),payroll=money(input.payroll,'payroll'),budget=money(input.ownerBudget,'ownerBudget');
 const attendance=money(input.attendance,'attendance'),capacity=money(input.arenaCapacity,'arenaCapacity');
 if(attendance>capacity)throw Error('Attendance exceeds arena capacity');
 const ticketPrice=money(input.ticketPrice,'ticketPrice'),merchandise=money(input.merchandiseRevenue,'merchandiseRevenue');
 const sponsorship=money(input.sponsorshipRevenue,'sponsorshipRevenue'),media=money(input.mediaRevenue,'mediaRevenue');
 const arena=money(input.arenaExpense,'arenaExpense'),operations=money(input.operationsExpense,'operationsExpense');
 const ticketRevenue=attendance*ticketPrice;
 if(!Number.isSafeInteger(ticketRevenue))throw Error('Ticket revenue overflow');
 const revenue=sum([ticketRevenue,merchandise,sponsorship,media]);
 const expenses=sum([payroll,arena,operations]);
 const profit=signed(revenue-expenses,'profit');
 return Object.freeze({ticketRevenue,revenue,expenses,profit,capSpace:signed(cap-payroll,'capSpace'),ownerBudgetRemaining:signed(budget-expenses,'ownerBudgetRemaining'),overCap:payroll>cap,overBudget:expenses>budget,attendance,capacity});
}
function projectSeason(gameDay,remainingHomeGames){money(remainingHomeGames,'remainingHomeGames');const d=evaluate(gameDay);return Object.freeze({projectedTicketRevenue:d.ticketRevenue*remainingHomeGames,remainingHomeGames,perGameTicketRevenue:d.ticketRevenue})}
const api=Object.freeze({evaluate,projectSeason});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HLMPhase11Finance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
