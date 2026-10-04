'use strict';
const assert = require('assert');
const { summarizeFrontOfficeSession } = require('./hlm-front-office-session-summary');

(() => {
  const summary = summarizeFrontOfficeSession({
    compatible: true,
    compatibility: { sourceSchema: 7, reasons: [] },
    audit: {
      counts: { players: 10, teams: 2, contracts: 4, transactions: 3, draftPicks: 8, prospects: 5 },
      warnings: ['example'],
      blockers: []
    },
    snapshot: { state: { settings: { controlledTeamId: 5 } } }
  });
  assert.strictEqual(summary.compatible, true);
  assert.strictEqual(summary.sourceSchema, 7);
  assert.strictEqual(summary.controlledTeamId, 5);
  assert.strictEqual(summary.counts.players, 10);
  assert.strictEqual(summary.warningCount, 1);
  assert.strictEqual(summary.blockerCount, 0);
  assert.strictEqual(summary.persistenceEnabled, false);

  const blocked = summarizeFrontOfficeSession({
    compatible: false,
    compatibility: { sourceSchema: 8, reasons: ['Unsupported schema'] },
    audit: { counts: {}, warnings: [], blockers: ['duplicate'] },
    snapshot: { state: { settings: {} } }
  });
  assert.strictEqual(blocked.controlledTeamId, null);
  assert.strictEqual(blocked.blockerCount, 1);
  assert.deepStrictEqual(blocked.compatibilityReasons, ['Unsupported schema']);

  assert.throws(() => summarizeFrontOfficeSession(null), /inspection/);
  console.log('Front Office read-only runtime session summary tests passed.');
})();
