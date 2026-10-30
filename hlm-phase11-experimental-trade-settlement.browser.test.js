'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const moduleFiles = [
  'hlm-game-state.js',
  'hlm-phase11-guarded-player-trade.js',
  'hlm-phase11-trade-financial-eligibility.js',
  'hlm-phase11-trade-restrictions.js',
  'hlm-phase11-isolated-trade-decision.js',
  'hlm-phase11-draft-pick-trade-readiness.js',
  'hlm-phase11-integrated-player-pick-trade.js',
  'hlm-phase11-protected-cpu-consent-contract.js',
  'hlm-phase11-trade-proposal-digest.js',
  'hlm-phase11-isolated-trade-settlement-transaction.js',
  'hlm-phase11-experimental-trade-indexeddb.js',
  'hlm-phase11-experimental-trade-settlement-harness.js'
];
const sources = Object.fromEntries(moduleFiles.map(file => [
  file,
  fs.readFileSync(path.join(__dirname, file), 'utf8')
]));
const databaseName = `hlm-franchise-manager-experimental-trade-step27-${process.pid}`;
const key = 'hlm-phase11-isolated-trade-settlement-test';

function moduleLoaderScript() {
  return `(() => {
    const sources = ${JSON.stringify(sources)};
    const cache = Object.create(null);
    function load(request) {
      const name = request.replace(/^\\.\\//, '').replace(/\\.js$/, '') + '.js';
      if (cache[name]) return cache[name].exports;
      if (!sources[name]) throw new Error('Unlisted test module: ' + name);
      const module = {exports: {}};
      cache[name] = module;
      const localRequire = dependency => load(dependency);
      new Function('require', 'module', 'exports', sources[name])(
        localRequire, module, module.exports
      );
      return module.exports;
    }
    window.Step27TradeModules = {
      ...Object.fromEntries(Object.keys(sources).map(name => [name, load(name)]))
    };
  })();`;
}

(async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('<!doctype html><title>Step 27 trade integration</title>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const origin = `http://127.0.0.1:${server.address().port}/`;
    await pageA.goto(origin);
    await pageA.addScriptTag({content: moduleLoaderScript()});

    const fixture = await pageA.evaluate(() => {
      const {createGameStateEnvelope} = window.Step27TradeModules['hlm-game-state.js'];
      return createGameStateEnvelope({
        meta: {saveId: 'step27-browser-only', controlledTeamId: 'A', currentDate: '2027-01-02'},
        teams: [{id: 'A'}, {id: 'B'}],
        players: [{id: 'p1', teamId: 'A'}, {id: 'p2', teamId: 'B'}],
        contracts: [
          {playerId: 'p1', teamId: 'A', status: 'active', aav: 1, tradePermission: 'allowed'},
          {playerId: 'p2', teamId: 'B', status: 'active', aav: 1, tradePermission: 'allowed'}
        ],
        draftPicks: [
          {id: 'pick1', year: 2027, round: 1, originalTeamId: 'A', teamId: 'A'},
          {id: 'pick2', year: 2028, round: 1, originalTeamId: 'B', teamId: 'B'}
        ],
        finances: {teamCapLimits: {A: 100, B: 100}},
        extensions: {
          tradeRosterLimits: {A: 10, B: 10},
          tradeDecisionConsents: [{
            receivingTeamId: 'B',
            outgoingPlayerId: 'p1',
            incomingPlayerId: 'p2',
            decision: 'accepted',
            source: 'receiving-team-authority'
          }]
        }
      });
    });

    const setup = await pageA.evaluate(async ({databaseName, key, fixture}) => {
      const {createExperimentalTradeSettlementHarness, TEST_ONLY_KEY_ID, TEST_ONLY_SIGNATURE} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-settlement-harness.js'];
      const {createTradeProposalBinding} =
        window.Step27TradeModules['hlm-phase11-isolated-trade-settlement-transaction.js'];
      const harness = createExperimentalTradeSettlementHarness({
        indexedDB,
        databaseName,
        enabled: true,
        testOnlyConsentDouble: true,
        now: () => new Date('2027-01-02T12:00:00Z')
      });
      await harness.repository.initializeSnapshot(key, fixture, 'revision-1');
      const trade = {
        outgoingPlayerId: 'p1',
        incomingPlayerId: 'p2',
        picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
      };
      const binding = await createTradeProposalBinding(fixture, trade, 'revision-1');
      const consent = {
        version: 1,
        decisionId: 'step27-decision-1',
        proposalDigest: binding.proposalDigest,
        digestSchema: binding.schema,
        controlledTeamId: 'A',
        teamId: 'B',
        stateRevision: 'revision-1',
        issuedAt: '2027-01-02T00:00:00Z',
        expiresAt: '2027-01-03T00:00:00Z',
        signature: TEST_ONLY_SIGNATURE,
        keyId: TEST_ONLY_KEY_ID,
        decision: 'approve',
        testOnly: true
      };
      const invalid = await harness.transaction.review({
        ...trade,
        picks: [{pickId: 'missing', fromTeamId: 'A', toTeamId: 'B'}]
      }, consent);
      const cancelled = await harness.transaction.review(trade, consent);
      const beforeCancel = await harness.repository.readSnapshot(key);
      const cancelResult = await harness.transaction.decide('cancel');
      const afterCancel = await harness.repository.readSnapshot(key);
      return {
        trade,
        consent,
        invalid,
        cancelled,
        cancelResult,
        beforeCancel,
        afterCancel,
        mode: harness.consentMode
      };
    }, {databaseName, key, fixture});

    assert.equal(setup.mode, 'TEST-ONLY-UNTRUSTED-DOUBLE');
    assert.equal(setup.invalid.code, 'source-validation-failed');
    assert.equal(setup.cancelled.status, 'isolated-trade-awaiting-gm-approval');
    assert.equal(setup.cancelResult.code, 'cancel');
    assert.deepEqual(setup.afterCancel, setup.beforeCancel);

    const pageB = await context.newPage();
    await pageB.goto(origin);
    await pageB.addScriptTag({content: moduleLoaderScript()});
    const secondReview = await pageB.evaluate(async ({databaseName, key, trade, consent}) => {
      const {createExperimentalTradeSettlementHarness} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-settlement-harness.js'];
      const harness = createExperimentalTradeSettlementHarness({
        indexedDB,
        databaseName,
        enabled: true,
        testOnlyConsentDouble: true,
        now: () => new Date('2027-01-02T12:00:00Z')
      });
      const review = await harness.transaction.review(trade, consent);
      window.step27PendingHarness = harness;
      return review;
    }, {databaseName, key, trade: setup.trade, consent: setup.consent});
    assert.equal(secondReview.status, 'isolated-trade-awaiting-gm-approval');

    const approval = await pageA.evaluate(async ({databaseName, key, trade, consent}) => {
      const {createExperimentalTradeSettlementHarness} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-settlement-harness.js'];
      const harness = createExperimentalTradeSettlementHarness({
        indexedDB,
        databaseName,
        enabled: true,
        testOnlyConsentDouble: true,
        now: () => new Date('2027-01-02T12:00:00Z')
      });
      const review = await harness.transaction.review(trade, consent);
      const result = await harness.transaction.decide('approve');
      return {review, result, state: await harness.repository.readSnapshot(key)};
    }, {databaseName, key, trade: setup.trade, consent: setup.consent});
    assert.equal(approval.review.status, 'isolated-trade-awaiting-gm-approval');
    assert.equal(approval.result.status, 'isolated-trade-candidate-committed');
    assert.equal(approval.result.replayed, false);
    assert.equal(approval.result.receipt.schema, 'hlm-experimental-trade-settlement-receipt-v1');
    assert.equal(approval.result.receipt.decisionId, 'step27-decision-1');
    assert.equal(approval.result.receipt.proposalDigest, approval.review.proposalDigest);
    assert.equal(approval.result.settlementAuthorized, false);
    assert.deepEqual(approval.state.state.universe.players.map(player => player.teamId), ['B', 'A']);
    assert.deepEqual(approval.state.state.assets.contracts.map(contract => contract.teamId), ['B', 'A']);
    assert.equal(approval.state.state.assets.draftPicks[0].teamId, 'B');
    assert.equal(approval.state.state.activity.transactions.length, 1);
    assert.equal(approval.state.state.activity.transactions[0].id, 'step27-decision-1');

    const staleDecision = await pageB.evaluate(async () =>
      window.step27PendingHarness.transaction.decide('approve'));
    assert.equal(staleDecision.code, 'stale-review');

    const repoChecks = await pageA.evaluate(async ({databaseName, key}) => {
      const {createExperimentalTradeIndexedDbRepository} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-indexeddb.js'];
      const repository = createExperimentalTradeIndexedDbRepository({indexedDB, databaseName, enabled: true});
      const latest = await repository.readSnapshot(key);
      const replay = await repository.commitTradeAtomically({
        key,
        expectedRevision: 'revision-1',
        decisionId: 'step27-decision-1',
        proposalDigest: 'digest',
        receivingTeamId: 'B',
        candidateState: {...latest.state, replayed: true}
      });
      let failed = false;
      try {
        await repository.commitTradeAtomically({
          key,
          expectedRevision: latest.revision,
          decisionId: 'step27-rollback',
          proposalDigest: 'digest',
          receivingTeamId: 'B',
          candidateState: {...latest.state, uncloneable() {}}
        });
      } catch {
        failed = true;
      }
      return {
        replay,
        failed,
        snapshot: await repository.readSnapshot(key),
        rollbackDecisionConsumed: await repository.hasConsumedDecision('step27-rollback'),
        openedDatabases: await indexedDB.databases().then(dbs => dbs.map(db => db.name))
      };
    }, {databaseName, key});
    assert.equal(repoChecks.replay.committed, false);
    assert.equal(repoChecks.replay.code, 'decision-binding-conflict');
    assert.equal(repoChecks.failed, true);
    assert.deepEqual(repoChecks.snapshot, approval.state);
    assert.equal(repoChecks.rollbackDecisionConsumed, false);
    assert.deepEqual(repoChecks.openedDatabases, [databaseName]);

    const recovered = await pageA.evaluate(async ({databaseName, key}) => {
      const {createExperimentalTradeSettlementHarness} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-settlement-harness.js'];
      const harness = createExperimentalTradeSettlementHarness({
        indexedDB,
        databaseName,
        enabled: true,
        testOnlyConsentDouble: true,
        now: () => new Date('2027-01-02T12:00:00Z')
      });
      return harness.repository.readSnapshot(key);
    }, {databaseName, key});
    assert.deepEqual(recovered, approval.state);

    const rejectProduction = await pageA.evaluate(() => {
      const {createExperimentalTradeSettlementHarness} =
        window.Step27TradeModules['hlm-phase11-experimental-trade-settlement-harness.js'];
      try {
        createExperimentalTradeSettlementHarness({
          indexedDB,
          databaseName: 'hlm_front_office_v8',
          enabled: true,
          testOnlyConsentDouble: true
        });
      } catch {
        return true;
      }
      return false;
    });
    assert.equal(rejectProduction, true);

    await pageA.evaluate(name => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Experimental test database deletion blocked'));
    }), databaseName);
    await context.close();
    console.log('Step 27 Chromium end-to-end isolated settlement harness tests passed; test-only consent double explicitly untrusted');
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
