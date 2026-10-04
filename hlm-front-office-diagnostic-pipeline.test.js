'use strict';
const assert = require('assert');
const { createFrontOfficeDiagnosticPipeline } = require('./hlm-front-office-diagnostic-pipeline');

(async () => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    players: [{ id: 1 }, { id: 2 }],
    teams: [{ id: 5 }],
    contracts: [{}],
    transactions: [{}],
    draftPicks: [{}]
  };

  const pipeline = createFrontOfficeDiagnosticPipeline(async () => source);
  assert.strictEqual(pipeline.readOnly, true);
  assert.strictEqual(pipeline.persistenceEnabled, false);

  const report = await pipeline.run();
  assert.strictEqual(report.readOnly, true);
  assert.strictEqual(report.persistenceEnabled, false);
  assert.strictEqual(report.sourceSchema, 7);
  assert.strictEqual(report.audit.readyForReadOnlyDiagnostics, true);
  assert.strictEqual(report.audit.counts.players, 2);
  assert.strictEqual(report.snapshot.state.settings.controlledTeamId, 5);

  report.snapshot.state.players[0].id = 99;
  assert.strictEqual(source.players[0].id, 1);

  const blocked = createFrontOfficeDiagnosticPipeline(async () => ({
    schema: 7,
    players: [{ id: 1 }, { id: 1 }],
    teams: [{ id: 5 }]
  }));
  const blockedReport = await blocked.run();
  assert.strictEqual(blockedReport.audit.readyForReadOnlyDiagnostics, false);
  assert.strictEqual(blockedReport.audit.duplicatePlayerIds, 1);

  console.log('Front Office read-only diagnostic pipeline tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
