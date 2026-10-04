'use strict';

const assert = require('assert');
const {
  buildTeamReferenceRegistry,
  resolveTeamReference,
  teamReferenceSummary
} = require('./hlm-team-reference-registry');

const universe = {
  teams: [{ id: 1, name: 'Known A' }, { id: 2, name: 'Known B' }],
  players: [
    { id: 10, teamId: 1 },
    { id: 11, teamId: 3515531 },
    { id: 12, teamId: 0 },
    { id: 13, teamId: -1 }
  ],
  draftPicks: [
    { originalTeamId: 2, ownerTeamId: 27 },
    { originalTeamId: 1, currentOwnerTeamId: 3515531 }
  ]
};

const before = JSON.stringify(universe);
const registry = buildTeamReferenceRegistry(universe);

assert.strictEqual(registry.teamsById.size, 2);
assert.strictEqual(resolveTeamReference(registry, 1).status, 'known-team');
assert.strictEqual(resolveTeamReference(registry, 3515531).status, 'unresolved-positive');
assert.strictEqual(resolveTeamReference(registry, 27).status, 'unresolved-positive');
assert.strictEqual(resolveTeamReference(registry, 0).status, 'sentinel');
assert.strictEqual(resolveTeamReference(registry, -1).status, 'sentinel');
assert.strictEqual(registry.diagnostics.unresolvedPositiveReferences.get(3515531).count, 2);
assert.strictEqual(registry.diagnostics.unresolvedPositiveReferences.get(27).count, 1);
assert.strictEqual(JSON.stringify(universe), before, 'source Universe must not be mutated');

assert.deepStrictEqual(teamReferenceSummary(registry), {
  knownTeams: 2,
  invalidTeamIds: 0,
  duplicateTeamIds: 0,
  unresolvedPositiveIds: 2,
  sentinelIds: 2
});

console.log('Team reference registry tests passed.');
