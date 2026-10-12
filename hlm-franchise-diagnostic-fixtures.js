'use strict';

/**
 * Mission 672: fictional inputs for testing diagnostic pipelines.
 * Factories return fresh data; they never read live franchise saves.
 */
const definitions = Object.freeze({
  clean: {
    universe: {
      teams: [{ id: 10, name: 'Northport Owls' }, { id: 20, name: 'Lakeview Comets' }],
      players: [{ id: 1, teamId: 10, first: 'Avery', last: 'Stone' }, { id: 2, teamId: 20, first: 'Morgan', last: 'Vale' }]
    },
    roster: { players: [] }
  },
  invalidIdentities: {
    universe: {
      teams: [{ id: 10, name: 'Northport Owls' }],
      players: [
        { id: 7, teamId: 10, first: 'Avery' },
        { id: 7, teamId: 10, first: 'Duplicate' },
        { id: 0, teamId: 10, first: 'Invalid' }
      ]
    },
    roster: { players: [{ id: 999, ovr: 65 }] }
  },
  unresolvedOrganizations: {
    universe: {
      teams: [{ id: 10, name: 'Northport Owls' }],
      players: [
        { id: 11, teamId: 10 },
        { id: 12, teamId: 3515531 },
        { id: 13, teamId: -1 },
        { id: 14, teamId: 0 },
        { id: 15, teamId: 100 }
      ]
    },
    roster: { players: [] }
  },
  mixedRoster: {
    universe: {
      teams: [{ id: 10, name: 'Northport Owls' }, { id: 20, name: 'Lakeview Comets' }],
      players: [
        { id: 21, teamId: 10, retired: false },
        { id: 22, teamId: 10, retired: true },
        { id: 23, teamId: 20, retired: false },
        { id: 24, teamId: 3515531, retired: false },
        { id: 25, teamId: -1, retired: false }
      ]
    },
    roster: { players: [{ id: 21, ovr: 81, pos: 'C' }, { id: 21, ovr: 82, pos: 'LW' }] }
  }
});

function createDiagnosticFixture(name) {
  if (!Object.prototype.hasOwnProperty.call(definitions, name)) {
    const error = new Error('Unknown diagnostic fixture: ' + String(name));
    error.code = 'UNKNOWN_DIAGNOSTIC_FIXTURE';
    throw error;
  }
  return JSON.parse(JSON.stringify(definitions[name]));
}

const DIAGNOSTIC_FIXTURE_NAMES = Object.freeze(Object.keys(definitions));

module.exports = { createDiagnosticFixture, DIAGNOSTIC_FIXTURE_NAMES };
