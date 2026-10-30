'use strict';
/* A-22 Step 34: default-off, deterministic, server-side CPU trade evaluation policy.
   Plugs into the experimental consent authority's `policy.evaluate(context)` interface.
   It reads only the authority's registered state; client approvals or valuations are never inputs. */

const SCHEMA = 'hlm-cpu-trade-evaluation-policy-v1';
const GROUPS = Object.freeze(['C', 'W', 'D', 'G']);
const GROUP_OF = Object.freeze({C: 'C', LW: 'W', RW: 'W', W: 'W', LD: 'D', RD: 'D', D: 'D', G: 'G'});

const DEFAULT_RULES = Object.freeze({
  acceptanceMargin: 0,
  player: Object.freeze({
    ovrBase: 50, ovrWeight: 1.5, potentialWeight: 0.5, potentialMaxAge: 24,
    declineStartAge: 31, declinePerYear: 2
  }),
  pick: Object.freeze({
    roundValues: Object.freeze({1: 40, 2: 20, 3: 10, 4: 6, 5: 4, 6: 2, 7: 1}),
    yearDiscountPerYear: 0.1
  }),
  needs: Object.freeze({
    positionMinimums: Object.freeze({C: 4, W: 8, D: 6, G: 2}),
    valuePerSlot: 15
  })
});

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype;
const isNum = v => typeof v === 'number' && Number.isFinite(v);

function mergeRules(overrides = {}) {
  if (!isPlainObject(overrides)) throw new TypeError('Rules must be a plain object');
  const allowed = Object.keys(DEFAULT_RULES);
  for (const key of Object.keys(overrides)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown rule: ${key}`);
  }
  const rules = {acceptanceMargin: overrides.acceptanceMargin ?? DEFAULT_RULES.acceptanceMargin};
  for (const section of ['player', 'pick', 'needs']) {
    const extra = overrides[section] ?? {};
    if (!isPlainObject(extra)) throw new TypeError(`Rule section ${section} must be an object`);
    for (const key of Object.keys(extra)) {
      if (!(key in DEFAULT_RULES[section])) throw new TypeError(`Unknown rule: ${section}.${key}`);
    }
    rules[section] = {...DEFAULT_RULES[section], ...extra};
  }
  rules.pick.roundValues = {...DEFAULT_RULES.pick.roundValues, ...(overrides.pick?.roundValues ?? {})};
  rules.needs.positionMinimums = {
    ...DEFAULT_RULES.needs.positionMinimums, ...(overrides.needs?.positionMinimums ?? {})
  };
  const numbers = [rules.acceptanceMargin, ...Object.values(rules.player),
    rules.pick.yearDiscountPerYear, rules.needs.valuePerSlot,
    ...Object.values(rules.pick.roundValues), ...Object.values(rules.needs.positionMinimums)];
  if (!numbers.every(isNum) || Object.values(rules.pick.roundValues).some(v => v < 0) ||
      Object.values(rules.needs.positionMinimums).some(v => !Number.isInteger(v) || v < 0) ||
      rules.pick.yearDiscountPerYear < 0 || rules.pick.yearDiscountPerYear >= 1 ||
      rules.needs.valuePerSlot < 0) {
    throw new TypeError('Rules must contain finite, non-negative, in-range numbers');
  }
  return deepFreeze(rules);
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

class MissingData extends Error {}
const need = (condition, code) => { if (!condition) throw new MissingData(code); };

function uniqueById(rows, id, code) {
  const found = (rows ?? []).filter(row => String(row?.id) === String(id));
  need(found.length === 1, code);
  return found[0];
}

function positionGroup(player) {
  const raw = player.position ?? player.pos;
  need(typeof raw === 'string' && raw.length > 0, 'player-position-missing');
  const group = GROUP_OF[raw.split('/')[0].trim().toUpperCase()];
  need(group, 'player-position-unknown');
  return group;
}

function playerValue(player, rules) {
  need(isNum(player.ovr) && isNum(player.age) && isNum(player.potential), 'player-ratings-missing');
  const r = rules.player;
  const potentialGap = player.age <= r.potentialMaxAge ? Math.max(0, player.potential - player.ovr) : 0;
  const decline = Math.max(0, player.age - r.declineStartAge) * r.declinePerYear;
  const value = Math.max(0, (player.ovr - r.ovrBase) * r.ovrWeight + potentialGap * r.potentialWeight - decline);
  return {value, group: positionGroup(player)};
}

function pickValue(pick, currentYear, rules) {
  const base = rules.pick.roundValues[String(pick.round)];
  need(isNum(base) && Number.isInteger(pick.year), 'pick-data-missing');
  const years = Math.max(0, pick.year - currentYear);
  return base * Math.pow(1 - rules.pick.yearDiscountPerYear, years);
}

function analyze(context, rules) {
  need(isPlainObject(context) && isPlainObject(context.proposal) && context.state, 'context-missing');
  const {proposal, state} = context;
  const cpuTeam = String(context.receivingTeamId);
  const humanTeam = String(context.controlledTeamId);
  need(cpuTeam && humanTeam && cpuTeam !== humanTeam &&
    String(state.meta?.controlledTeamId) === humanTeam, 'team-binding-invalid');
  need(Object.keys(proposal).sort().join(',') === 'incomingPlayerId,outgoingPlayerId,picks' &&
    Array.isArray(proposal.picks), 'proposal-shape-invalid');
  const year = Number.parseInt(String(state.meta?.currentDate ?? '').slice(0, 4), 10);
  need(Number.isInteger(year), 'current-date-missing');

  const players = state.universe?.players;
  const toCpu = uniqueById(players, proposal.outgoingPlayerId, 'outgoing-player-missing');
  const fromCpu = uniqueById(players, proposal.incomingPlayerId, 'incoming-player-missing');
  need(String(toCpu.teamId) === humanTeam && String(fromCpu.teamId) === cpuTeam, 'player-ownership-invalid');

  const received = [{kind: 'player', id: String(toCpu.id), ...playerValue(toCpu, rules)}];
  const given = [{kind: 'player', id: String(fromCpu.id), ...playerValue(fromCpu, rules)}];
  const seen = new Set();
  for (const transfer of proposal.picks) {
    need(isPlainObject(transfer), 'pick-transfer-invalid');
    const id = String(transfer.pickId);
    need(!seen.has(id), 'pick-duplicate');
    seen.add(id);
    const pick = uniqueById(state.assets?.draftPicks, id, 'pick-missing');
    const from = String(transfer.fromTeamId);
    const to = String(transfer.toTeamId);
    need(String(pick.teamId) === from && ((from === humanTeam && to === cpuTeam) ||
      (from === cpuTeam && to === humanTeam)), 'pick-ownership-invalid');
    const entry = {kind: 'pick', id, value: pickValue(pick, year, rules)};
    (to === cpuTeam ? received : given).push(entry);
  }

  const roster = (players ?? []).filter(p => String(p.teamId) === cpuTeam && p.status !== 'retired');
  const before = Object.fromEntries(GROUPS.map(g => [g, 0]));
  for (const p of roster) before[positionGroup(p)] += 1;
  const after = {...before};
  after[received[0].group] += 1;
  after[given[0].group] -= 1;
  let slotsImproved = 0;
  for (const g of GROUPS) {
    const min = rules.needs.positionMinimums[g] ?? 0;
    slotsImproved += Math.max(0, min - before[g]) - Math.max(0, min - after[g]);
  }

  const sum = list => list.reduce((total, item) => total + item.value, 0);
  const receivedValue = sum(received);
  const givenValue = sum(given);
  const needAdjustment = slotsImproved * rules.needs.valuePerSlot;
  const netScore = receivedValue - givenValue + needAdjustment;
  return {
    receivedValue, givenValue, needAdjustment, netScore,
    cpuDepthBefore: before, cpuDepthAfter: after,
    received: received.map(({kind, id, value}) => ({kind, id, value})),
    given: given.map(({kind, id, value}) => ({kind, id, value}))
  };
}

function createCpuTradeEvaluationPolicy({enabled = false, rules} = {}) {
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid policy enable flag');
  if (enabled === false) {
    return Object.freeze({
      enabled: false,
      explain: () => Object.freeze({schema: SCHEMA, decision: 'declined', reasons: ['policy-disabled']}),
      async evaluate() { throw new Error('CPU trade evaluation policy is disabled'); }
    });
  }
  const frozenRules = mergeRules(rules);

  function explain(context) {
    try {
      const a = analyze(context, frozenRules);
      const accepted = a.netScore >= frozenRules.acceptanceMargin;
      return deepFreeze({
        schema: SCHEMA,
        decision: accepted ? 'accepted' : 'declined',
        reasons: [accepted ? 'value-meets-margin' : 'value-below-margin'],
        margin: frozenRules.acceptanceMargin,
        ...a
      });
    } catch (error) {
      if (!(error instanceof MissingData)) {
        return deepFreeze({schema: SCHEMA, decision: 'declined', reasons: ['evaluation-error']});
      }
      return deepFreeze({schema: SCHEMA, decision: 'declined', reasons: [`missing-or-invalid:${error.message}`]});
    }
  }

  return Object.freeze({
    enabled: true,
    rules: frozenRules,
    explain,
    async evaluate(context) { return explain(context).decision; }
  });
}

module.exports = {SCHEMA, DEFAULT_RULES, createCpuTradeEvaluationPolicy};
