"use strict";
var HLMPhase11SimBundle = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // hlm-game-state.js
  var require_hlm_game_state = __commonJS({
    "hlm-game-state.js"(exports, module) {
      "use strict";
      var GAME_STATE_SCHEMA_VERSION = 1;
      function clone(value) {
        if (value === void 0) return void 0;
        return JSON.parse(JSON.stringify(value));
      }
      function createGameStateEnvelope(input = {}) {
        const meta = input.meta || {};
        return {
          schemaVersion: GAME_STATE_SCHEMA_VERSION,
          meta: {
            saveId: meta.saveId || null,
            createdAt: meta.createdAt || null,
            updatedAt: meta.updatedAt || null,
            controlledTeamId: meta.controlledTeamId ?? null,
            currentDate: meta.currentDate || null
          },
          universe: {
            players: clone(input.players || []),
            teams: clone(input.teams || []),
            leagues: clone(input.leagues || []),
            prospects: clone(input.prospects || []),
            staff: clone(input.staff || [])
          },
          assets: {
            contracts: clone(input.contracts || []),
            draftPicks: clone(input.draftPicks || [])
          },
          activity: {
            transactions: clone(input.transactions || []),
            games: clone(input.games || []),
            injuries: clone(input.injuries || [])
          },
          history: {
            seasons: clone(input.seasons || []),
            statistics: clone(input.statistics || []),
            records: clone(input.history || [])
          },
          finances: clone(input.finances || {}),
          extensions: clone(input.extensions || {})
        };
      }
      function validateGameStateEnvelope(state) {
        const errors = [];
        if (!state || typeof state !== "object" || Array.isArray(state)) {
          return { valid: false, errors: [{ code: "STATE_NOT_OBJECT" }] };
        }
        if (state.schemaVersion !== GAME_STATE_SCHEMA_VERSION) {
          errors.push({ code: "UNSUPPORTED_SCHEMA_VERSION", value: state.schemaVersion });
        }
        for (const key of ["meta", "universe", "assets", "activity", "history", "finances", "extensions"]) {
          if (!state[key] || typeof state[key] !== "object" || Array.isArray(state[key])) {
            errors.push({ code: "MISSING_STATE_SECTION", section: key });
          }
        }
        const arrays = [
          ["universe", "players"],
          ["universe", "teams"],
          ["universe", "leagues"],
          ["universe", "prospects"],
          ["universe", "staff"],
          ["assets", "contracts"],
          ["assets", "draftPicks"],
          ["activity", "transactions"],
          ["activity", "games"],
          ["activity", "injuries"],
          ["history", "seasons"],
          ["history", "statistics"],
          ["history", "records"]
        ];
        for (const [section, field] of arrays) {
          if (state[section] && !Array.isArray(state[section][field])) {
            errors.push({ code: "STATE_FIELD_NOT_ARRAY", section, field });
          }
        }
        return { valid: errors.length === 0, errors };
      }
      module.exports = {
        GAME_STATE_SCHEMA_VERSION,
        createGameStateEnvelope,
        validateGameStateEnvelope
      };
    }
  });

  // hlm-master-calendar.js
  var require_hlm_master_calendar = __commonJS({
    "hlm-master-calendar.js"(exports, module) {
      "use strict";
      var ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
      function assertIsoDate(value) {
        if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
          const error = new Error("Calendar date must use YYYY-MM-DD.");
          error.code = "INVALID_CALENDAR_DATE";
          throw error;
        }
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
          const error = new Error("Calendar date is not a real Gregorian date.");
          error.code = "INVALID_CALENDAR_DATE";
          throw error;
        }
        return value;
      }
      function addCalendarDays(dateText, days) {
        assertIsoDate(dateText);
        if (!Number.isSafeInteger(days)) {
          const error = new Error("Calendar day advancement must be a safe integer.");
          error.code = "INVALID_CALENDAR_ADVANCE";
          throw error;
        }
        const [year, month, day] = dateText.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
      }
      function createMasterCalendar(input = {}) {
        const currentDate = assertIsoDate(input.currentDate);
        return Object.freeze({
          kind: "master-hockey-calendar",
          version: 1,
          currentDate,
          advanceDays(days = 1) {
            if (!Number.isSafeInteger(days) || days < 1) {
              const error = new Error("Calendar must advance by at least one whole day.");
              error.code = "INVALID_CALENDAR_ADVANCE";
              throw error;
            }
            return createMasterCalendar({ currentDate: addCalendarDays(currentDate, days) });
          }
        });
      }
      module.exports = { assertIsoDate, addCalendarDays, createMasterCalendar };
    }
  });

  // hlm-phase10-day-advance.js
  var require_hlm_phase10_day_advance = __commonJS({
    "hlm-phase10-day-advance.js"(exports, module) {
      "use strict";
      var { validateGameStateEnvelope } = require_hlm_game_state();
      var { addCalendarDays, assertIsoDate } = require_hlm_master_calendar();
      function prepareDayAdvance(state) {
        const validation = validateGameStateEnvelope(state);
        if (!validation.valid) {
          const error = new Error("Invalid game state");
          error.code = "INVALID_GAME_STATE";
          error.details = validation.errors;
          throw error;
        }
        assertIsoDate(state.meta.currentDate);
        const fromDate = state.meta.currentDate;
        const toDate = addCalendarDays(fromDate, 1);
        const nextState = JSON.parse(JSON.stringify(state));
        nextState.meta.currentDate = toDate;
        const scheduledToday = nextState.activity.games.filter(
          (game) => game && game.status === "scheduled" && game.date === toDate
        ).map((game) => game.id ?? null);
        return {
          fromDate,
          toDate,
          scheduledGameIds: scheduledToday,
          nextState
        };
      }
      module.exports = { prepareDayAdvance };
    }
  });

  // hlm-phase10-game-simulator.js
  var require_hlm_phase10_game_simulator = __commonJS({
    "hlm-phase10-game-simulator.js"(exports, module) {
      "use strict";
      function simulateGameScore(input) {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Game input must be an object");
        const { gameId, homeTeamId, awayTeamId, seed } = input;
        if (gameId == null || homeTeamId == null || awayTeamId == null || String(homeTeamId) === String(awayTeamId) || !Number.isSafeInteger(seed) || seed < 0) {
          const error = new Error("Invalid game simulation input");
          error.code = "INVALID_GAME_INPUT";
          throw error;
        }
        let state = seed >>> 0;
        const mix = String(gameId) + "|" + String(homeTeamId) + "|" + String(awayTeamId);
        for (let i = 0; i < mix.length; i++) state = Math.imul(state ^ mix.charCodeAt(i), 16777619) >>> 0;
        const next = () => {
          state = Math.imul(state, 1664525) + 1013904223 >>> 0;
          return state / 4294967296;
        };
        const homeGoals = Math.floor(next() * 6);
        const awayGoals = Math.floor(next() * 6);
        const overtime = homeGoals === awayGoals;
        const finalHome = homeGoals + (overtime && next() >= 0.5 ? 1 : 0);
        const finalAway = awayGoals + (overtime && finalHome === homeGoals ? 1 : 0);
        return Object.freeze({
          gameId,
          homeTeamId,
          awayTeamId,
          homeGoals: finalHome,
          awayGoals: finalAway,
          overtime,
          winnerTeamId: finalHome > finalAway ? homeTeamId : awayTeamId,
          status: "final"
        });
      }
      module.exports = { simulateGameScore };
    }
  });

  // hlm-phase10-apply-game.js
  var require_hlm_phase10_apply_game = __commonJS({
    "hlm-phase10-apply-game.js"(exports, module) {
      "use strict";
      var { validateGameStateEnvelope } = require_hlm_game_state();
      var { simulateGameScore } = require_hlm_phase10_game_simulator();
      function applyScheduledGame(state, gameId, seed) {
        const validation = validateGameStateEnvelope(state);
        if (!validation.valid) {
          const error = new Error("Invalid game state");
          error.code = "INVALID_GAME_STATE";
          throw error;
        }
        if (gameId == null) throw new TypeError("Game id required");
        const nextState = JSON.parse(JSON.stringify(state));
        const matches = nextState.activity.games.filter((game2) => game2 && String(game2.id) === String(gameId));
        if (matches.length !== 1) throw new Error("Scheduled game must exist exactly once");
        const game = matches[0];
        if (game.status !== "scheduled") throw new Error("Game already played or not scheduled");
        if (!nextState.universe.teams.some((team) => team && String(team.id) === String(game.homeTeamId)) || !nextState.universe.teams.some((team) => team && String(team.id) === String(game.awayTeamId))) {
          throw new Error("Game references unknown team");
        }
        const result = simulateGameScore({ gameId: game.id, homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId, seed });
        Object.assign(game, result);
        return { nextState, result };
      }
      module.exports = { applyScheduledGame };
    }
  });

  // hlm-phase10-standings.js
  var require_hlm_phase10_standings = __commonJS({
    "hlm-phase10-standings.js"(exports, module) {
      "use strict";
      function calculateStandings(teams, games) {
        if (!Array.isArray(teams) || !Array.isArray(games)) throw new TypeError("Teams and games must be arrays");
        const standings = /* @__PURE__ */ new Map();
        for (const team of teams) {
          if (!team || team.id == null) throw new TypeError("Team requires id");
          const id = String(team.id);
          if (standings.has(id)) throw new Error("Duplicate team id: " + id);
          standings.set(id, { teamId: team.id, teamName: team.name || null, gp: 0, w: 0, l: 0, otl: 0, gf: 0, ga: 0, points: 0 });
        }
        const seen = /* @__PURE__ */ new Set();
        for (const game of games) {
          if (!game || game.status !== "final") continue;
          if (game.id == null) throw new Error("Final game requires id");
          const gameId = String(game.id);
          if (seen.has(gameId)) throw new Error("Duplicate final game: " + gameId);
          seen.add(gameId);
          const home = standings.get(String(game.homeTeamId));
          const away = standings.get(String(game.awayTeamId));
          if (!home || !away || home === away) throw new Error("Final game has invalid teams: " + gameId);
          const hg = game.homeGoals, ag = game.awayGoals;
          if (!Number.isSafeInteger(hg) || !Number.isSafeInteger(ag) || hg < 0 || ag < 0 || hg === ag) {
            throw new Error("Final game requires non-tied nonnegative integer scores: " + gameId);
          }
          if (game.overtime != null && typeof game.overtime !== "boolean") throw new Error("Invalid overtime flag: " + gameId);
          const winner = hg > ag ? home : away;
          const loser = hg > ag ? away : home;
          home.gp++;
          away.gp++;
          home.gf += hg;
          home.ga += ag;
          away.gf += ag;
          away.ga += hg;
          winner.w++;
          winner.points += 2;
          if (game.overtime) {
            loser.otl++;
            loser.points++;
          } else loser.l++;
        }
        return [...standings.values()].sort((a, b) => b.points - a.points || b.w - a.w || b.gf - b.ga - (a.gf - a.ga) || String(a.teamId).localeCompare(String(b.teamId)));
      }
      module.exports = { calculateStandings };
    }
  });

  // hlm-phase10-simulate-day.js
  var require_hlm_phase10_simulate_day = __commonJS({
    "hlm-phase10-simulate-day.js"(exports, module) {
      "use strict";
      var { prepareDayAdvance } = require_hlm_phase10_day_advance();
      var { applyScheduledGame } = require_hlm_phase10_apply_game();
      var { calculateStandings } = require_hlm_phase10_standings();
      function simulateNextDay(state, seed = 0) {
        if (!Number.isSafeInteger(seed) || seed < 0) throw new TypeError("Seed must be a nonnegative safe integer");
        const day = prepareDayAdvance(state);
        let nextState = day.nextState;
        const results = [];
        const games = nextState.activity.games.filter((game) => game && game.status === "scheduled" && game.date === day.toDate);
        const ids = /* @__PURE__ */ new Set();
        for (const game of games) {
          if (game.id == null || ids.has(String(game.id))) throw new Error("Duplicate or missing scheduled game id");
          ids.add(String(game.id));
        }
        for (const game of games) {
          const applied = applyScheduledGame(nextState, game.id, seed);
          nextState = applied.nextState;
          results.push(applied.result);
        }
        const standings = calculateStandings(nextState.universe.teams, nextState.activity.games);
        return { fromDate: day.fromDate, toDate: day.toDate, nextState, results, standings };
      }
      module.exports = { simulateNextDay };
    }
  });

  // hlm-phase11-finance-engine.js
  var require_hlm_phase11_finance_engine = __commonJS({
    "hlm-phase11-finance-engine.js"(exports, module) {
      (function(root) {
        "use strict";
        function money(value, label) {
          if (!Number.isSafeInteger(value) || value < 0) throw Error("Invalid nonnegative integer " + label);
          return value;
        }
        function signed(value, label) {
          if (!Number.isSafeInteger(value)) throw Error("Invalid integer " + label);
          return value;
        }
        function add(a, b) {
          const n = a + b;
          if (!Number.isSafeInteger(n)) throw Error("Financial integer overflow");
          return n;
        }
        function sum(values) {
          return values.reduce((a, b) => add(a, b), 0);
        }
        function evaluate(input) {
          if (!input || typeof input !== "object") throw Error("Financial input required");
          const cap = money(input.salaryCap, "salaryCap"), payroll = money(input.payroll, "payroll"), budget = money(input.ownerBudget, "ownerBudget");
          const attendance = money(input.attendance, "attendance"), capacity = money(input.arenaCapacity, "arenaCapacity");
          if (attendance > capacity) throw Error("Attendance exceeds arena capacity");
          const ticketPrice = money(input.ticketPrice, "ticketPrice"), merchandise = money(input.merchandiseRevenue, "merchandiseRevenue");
          const sponsorship = money(input.sponsorshipRevenue, "sponsorshipRevenue"), media = money(input.mediaRevenue, "mediaRevenue");
          const arena = money(input.arenaExpense, "arenaExpense"), operations = money(input.operationsExpense, "operationsExpense");
          const ticketRevenue = attendance * ticketPrice;
          if (!Number.isSafeInteger(ticketRevenue)) throw Error("Ticket revenue overflow");
          const revenue = sum([ticketRevenue, merchandise, sponsorship, media]);
          const expenses = sum([payroll, arena, operations]);
          const profit = signed(revenue - expenses, "profit");
          return Object.freeze({ ticketRevenue, revenue, expenses, profit, capSpace: signed(cap - payroll, "capSpace"), ownerBudgetRemaining: signed(budget - expenses, "ownerBudgetRemaining"), overCap: payroll > cap, overBudget: expenses > budget, attendance, capacity });
        }
        function projectSeason(gameDay, remainingHomeGames) {
          money(remainingHomeGames, "remainingHomeGames");
          const d = evaluate(gameDay);
          return Object.freeze({ projectedTicketRevenue: d.ticketRevenue * remainingHomeGames, remainingHomeGames, perGameTicketRevenue: d.ticketRevenue });
        }
        const api = Object.freeze({ evaluate, projectSeason });
        if (typeof module !== "undefined" && module.exports) module.exports = api;
        else root.HLMPhase11Finance = api;
      })(typeof globalThis !== "undefined" ? globalThis : exports);
    }
  });

  // hlm-phase11-finance-integration.js
  var require_hlm_phase11_finance_integration = __commonJS({
    "hlm-phase11-finance-integration.js"(exports, module) {
      (function(root) {
        "use strict";
        const finance = typeof module !== "undefined" && module.exports ? require_hlm_phase11_finance_engine() : root.HLMPhase11Finance;
        function integer(v, label) {
          if (!Number.isSafeInteger(v) || v < 0) throw Error("Invalid " + label);
          return v;
        }
        function computeSeason(team, calendar) {
          if (!team || !calendar) throw Error("Team and calendar required");
          const homeGames = integer(calendar.homeGamesPlayed, "homeGamesPlayed"), remaining = integer(calendar.remainingHomeGames, "remainingHomeGames");
          const base = finance.evaluate(team);
          const earnedTickets = base.ticketRevenue * homeGames;
          if (!Number.isSafeInteger(earnedTickets)) throw Error("Season revenue overflow");
          const revenue = earnedTickets + base.revenue - base.ticketRevenue;
          if (!Number.isSafeInteger(revenue)) throw Error("Season revenue overflow");
          const profit = revenue - base.expenses;
          if (!Number.isSafeInteger(profit)) throw Error("Season profit overflow");
          const forecast = finance.projectSeason(team, remaining);
          return Object.freeze({ homeGamesPlayed: homeGames, remainingHomeGames: remaining, earnedTickets, revenue, expenses: base.expenses, profit, forecastTicketRevenue: forecast.projectedTicketRevenue, projectedRevenue: revenue + forecast.projectedTicketRevenue, capSpace: base.capSpace, ownerBudgetRemaining: base.ownerBudgetRemaining, overCap: base.overCap, overBudget: base.overBudget });
        }
        function evaluateDecision(team, decision) {
          if (!decision || !["sign", "release"].includes(decision.type)) throw Error("Unsupported financial decision");
          const salary = integer(decision.annualSalary, "annualSalary");
          const payroll = integer(team.payroll, "payroll");
          const nextPayroll = decision.type === "sign" ? payroll + salary : payroll - salary;
          if (!Number.isSafeInteger(nextPayroll) || nextPayroll < 0) throw Error("Invalid resulting payroll");
          const next = { ...team, payroll: nextPayroll }, result = finance.evaluate(next);
          return Object.freeze({ allowed: !result.overCap && !result.overBudget, nextPayroll, capSpace: result.capSpace, budgetRemaining: result.ownerBudgetRemaining, reasons: [...result.overCap ? ["SALARY_CAP_EXCEEDED"] : [], ...result.overBudget ? ["OWNER_BUDGET_EXCEEDED"] : []] });
        }
        function cpuRecommendation(team) {
          const f = finance.evaluate(team);
          return Object.freeze({ priority: f.overCap ? "REDUCE_PAYROLL" : f.overBudget ? "REDUCE_EXPENSES" : f.capSpace > 0 ? "EVALUATE_ROSTER_UPGRADE" : "MAINTAIN_ROSTER", capSpace: f.capSpace, ownerBudgetRemaining: f.ownerBudgetRemaining });
        }
        function dashboard(team, calendar) {
          const s = computeSeason(team, calendar), cpu = cpuRecommendation(team);
          return Object.freeze({ heading: "Franchise Finances", cards: [{ label: "Revenue", value: s.revenue }, { label: "Expenses", value: s.expenses }, { label: "Profit", value: s.profit }, { label: "Cap Space", value: s.capSpace }, { label: "Owner Budget Remaining", value: s.ownerBudgetRemaining }, { label: "Projected Revenue", value: s.projectedRevenue }], cpuPriority: cpu.priority, warning: s.overCap || s.overBudget });
        }
        const api = Object.freeze({ computeSeason, evaluateDecision, cpuRecommendation, dashboard });
        if (typeof module !== "undefined" && module.exports) module.exports = api;
        else root.HLMPhase11FinanceIntegration = api;
      })(typeof globalThis !== "undefined" ? globalThis : exports);
    }
  });

  // hlm-phase11-gamestate-finance.js
  var require_hlm_phase11_gamestate_finance = __commonJS({
    "hlm-phase11-gamestate-finance.js"(exports, module) {
      "use strict";
      var { validateGameStateEnvelope } = require_hlm_game_state();
      var { computeSeason, evaluateDecision, cpuRecommendation, dashboard } = require_hlm_phase11_finance_integration();
      var { simulateNextDay } = require_hlm_phase10_simulate_day();
      function safe(n, label) {
        if (!Number.isSafeInteger(n) || n < 0) throw Error("Invalid " + label);
        return n;
      }
      function teamKey(x) {
        return String(x);
      }
      function derive(state, teamId, policy) {
        const validation = validateGameStateEnvelope(state);
        if (!validation.valid) throw Error("Invalid GameState envelope");
        const team = state.universe.teams.find((t) => teamKey(t.id) === teamKey(teamId));
        if (!team) throw Error("Unknown team");
        if (!policy || typeof policy !== "object") throw Error("Explicit financial policy required");
        const games = state.activity.games.filter((g) => teamKey(g.homeTeamId) === teamKey(teamId));
        const played = games.filter((g) => g.status === "final" || g.status === "completed").length;
        const remaining = games.filter((g) => g.status === "scheduled").length;
        const contracts = state.assets.contracts.filter((c) => teamKey(c.teamId) === teamKey(teamId) && c.status !== "expired");
        const payroll = contracts.reduce((total, c) => {
          const salary = safe(c.annualSalary, "contract annualSalary");
          const n = total + salary;
          if (!Number.isSafeInteger(n)) throw Error("Payroll overflow");
          return n;
        }, 0);
        const input = { ...policy, payroll };
        const calendar = { homeGamesPlayed: played, remainingHomeGames: remaining };
        const result = computeSeason(input, calendar);
        return Object.freeze({ teamId: team.id, teamName: team.name, contractCount: contracts.length, calendar, financials: result, cpu: cpuRecommendation(input), dashboard: dashboard(input, calendar), policy: input });
      }
      function previewDay(state, seed, teamId, policy) {
        const simulation = simulateNextDay(state, seed);
        const before = derive(state, teamId, policy), after = derive(simulation.nextState, teamId, policy);
        return Object.freeze({ fromDate: simulation.fromDate, toDate: simulation.toDate, gameResults: simulation.results.length, before, after, nextState: simulation.nextState });
      }
      function previewSigning(state, teamId, policy, salary) {
        const projection = derive(state, teamId, policy);
        return evaluateDecision(projection.policy, { type: "sign", annualSalary: salary });
      }
      module.exports = { derive, previewDay, previewSigning };
    }
  });

  // hlm-phase11-finance-state-commit.js
  var require_hlm_phase11_finance_state_commit = __commonJS({
    "hlm-phase11-finance-state-commit.js"(exports, module) {
      "use strict";
      var { validateGameStateEnvelope } = require_hlm_game_state();
      var { derive, previewDay } = require_hlm_phase11_gamestate_finance();
      function assertState(state) {
        if (!validateGameStateEnvelope(state).valid) throw Error("Invalid GameState");
      }
      function clone(state) {
        return JSON.parse(JSON.stringify(state));
      }
      function writeFinanceSnapshot(state, teamId, policy, { confirmed = false } = {}) {
        if (confirmed !== true) throw Error("Explicit finance snapshot confirmation required");
        assertState(state);
        const calculated = derive(state, teamId, policy);
        const next = clone(state), id = String(teamId);
        if (!next.finances.teamSnapshots || typeof next.finances.teamSnapshots !== "object" || Array.isArray(next.finances.teamSnapshots)) next.finances.teamSnapshots = {};
        next.finances.teamSnapshots[id] = { teamId: calculated.teamId, teamName: calculated.teamName, calendar: calculated.calendar, financials: calculated.financials, cpu: calculated.cpu, policy: calculated.policy };
        assertState(next);
        return next;
      }
      function advanceWithFinances(state, seed, teamIds, policies, { confirmed = false } = {}) {
        if (confirmed !== true) throw Error("Explicit finance simulation confirmation required");
        assertState(state);
        if (!Array.isArray(teamIds) || !teamIds.length) throw Error("Team ids required");
        const unique = new Set(teamIds.map(String));
        if (unique.size !== teamIds.length) throw Error("Duplicate team id");
        const simulation = previewDay(state, seed, teamIds[0], policies[String(teamIds[0])]);
        let next = simulation.nextState;
        for (const id of teamIds) {
          const policy = policies[String(id)];
          if (!policy) throw Error("Missing financial policy for team " + id);
          next = writeFinanceSnapshot(next, id, policy, { confirmed: true });
        }
        return { nextState: next, results: simulation.gameResults, fromDate: simulation.fromDate, toDate: simulation.toDate };
      }
      module.exports = { writeFinanceSnapshot, advanceWithFinances };
    }
  });

  // hlm-phase11-browser-simulation-entry.js
  var require_hlm_phase11_browser_simulation_entry = __commonJS({
    "hlm-phase11-browser-simulation-entry.js"(exports, module) {
      var { simulateNextDay } = require_hlm_phase10_simulate_day();
      var { advanceWithFinances } = require_hlm_phase11_finance_state_commit();
      var { validateGameStateEnvelope } = require_hlm_game_state();
      function preview(state, seed, teamIds, policies) {
        if (!validateGameStateEnvelope(state).valid) throw Error("Invalid GameState");
        if (!Array.isArray(teamIds) || teamIds.length === 0) throw Error("Select at least one team");
        const outcome = advanceWithFinances(state, seed, teamIds, policies, { confirmed: true });
        return { nextState: outcome.nextState, results: outcome.results, fromDate: outcome.fromDate, toDate: outcome.toDate };
      }
      module.exports = { preview, simulateNextDay };
    }
  });
  return require_hlm_phase11_browser_simulation_entry();
})();
