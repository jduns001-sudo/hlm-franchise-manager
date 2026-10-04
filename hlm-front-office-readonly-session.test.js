'use strict';
const assert = require('assert');
const { createFrontOfficeReadOnlySession } = require('./hlm-front-office-readonly-session');

(async () => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    players: [{ id: 1 }],
    teams: [{ id: 5 }],
    contracts: [],
    transactions: [],
    draftPicks: []
  };
  const session = createFrontOfficeReadOnlySession(async () => source);
  assert.strictEqual(session.readOnly, true);
  assert.strictEqual(session.persistenceEnabled, false);

  const inspection = await session.inspect();
  assert.strictEqual(inspection.compatible, true);
  assert.strictEqual(inspection.readOnly, true);
  assert.strictEqual(inspection.persistenceEnabled, false);
  assert.strictEqual(inspection.snapshot.state.settings.controlledTeamId, 5);

  const incompatible = createFrontOfficeReadOnlySession(async () => ({
    schema: 8,
    settings: { controlledTeamId: 5 },
    players: [],
    teams: [{ id: 5 }]
  }));
  const bad = await incompatible.inspect();
  assert.strictEqual(bad.compatible, false);
  assert(bad.compatibility.reasons.some(x => /Unsupported/.test(x)));

  console.log('Front Office read-only runtime session tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
