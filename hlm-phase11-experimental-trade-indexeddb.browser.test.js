'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const source = fs.readFileSync(
  path.join(__dirname, 'hlm-phase11-experimental-trade-indexeddb.js'),
  'utf8'
);
const databaseName = `hlm-franchise-manager-experimental-trade-step26-${process.pid}`;
const isolatedKey = 'hlm-phase11-isolated-browser-test';
const productionKey = 'hlm_front_office_v8';

async function installDatabaseGuard(page) {
  await page.evaluate(() => {
    window.openedDatabases = [];
    window.guardedIndexedDB = {
      open(name, version) {
        window.openedDatabases.push(name);
        if (!name.startsWith('hlm-franchise-manager-experimental-trade-')) {
          throw new Error(`Nonexperimental database access: ${name}`);
        }
        return indexedDB.open(name, version);
      }
    };
  });
}

async function openRepository(page, name) {
  return page.evaluate(databaseName => {
    const repository = window.HLMExperimentalTradeIndexedDB
      .createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
    return Boolean(repository);
  }, name);
}

(async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('<!doctype html><title>Step 26 isolated IndexedDB tests</title>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const origin = `http://127.0.0.1:${server.address().port}/`;
    await pageA.goto(origin);
    await pageA.addScriptTag({content: source});
    await installDatabaseGuard(pageA);
    await openRepository(pageA, databaseName);

    const initial = await pageA.evaluate(async ({databaseName, isolatedKey}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      const state = {
        schemaVersion: 1,
        universe: {players: [{id: 'p1', teamId: 'A'}]},
        assets: {draftPicks: []},
        activity: {transactions: []}
      };
      await repo.initializeSnapshot(isolatedKey, state, 'revision-1');
      return repo.readSnapshot(isolatedKey);
    }, {databaseName, isolatedKey});

    const pageB = await context.newPage();
    await pageB.goto(origin);
    await pageB.addScriptTag({content: source});
    await installDatabaseGuard(pageB);
    await openRepository(pageB, databaseName);
    const staleTabSnapshot = await pageB.evaluate(async ({databaseName, isolatedKey}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      return repo.readSnapshot(isolatedKey);
    }, {databaseName, isolatedKey});
    assert.deepEqual(staleTabSnapshot, initial);

    const commitRequest = {
      key: isolatedKey,
      expectedRevision: initial.revision,
      decisionId: 'decision-1',
      proposalDigest: 'digest-1',
      receivingTeamId: 'B',
      candidateState: {
        ...initial.state,
        universe: {players: [{id: 'p1', teamId: 'B'}]},
        activity: {transactions: [{id: 'decision-1'}]}
      }
    };
    const duplicateCommits = await Promise.all([pageA, pageB].map(page => page.evaluate(
      async ({databaseName, request}) => {
        const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
          indexedDB: window.guardedIndexedDB,
          enabled: true,
          databaseName
        });
        return repo.commitTradeAtomically(request);
      },
      {databaseName, request: commitRequest}
    )));
    assert.ok(duplicateCommits.every(result => result.committed === true));
    assert.deepEqual(duplicateCommits[0].receipt, duplicateCommits[1].receipt);
    assert.deepEqual(duplicateCommits.map(result => result.replayed).sort(), [false, true]);
    const firstReceipt = duplicateCommits[0].receipt;
    const replayAfterLostResponse = await pageA.evaluate(
      async ({databaseName, request}) => {
        const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
          indexedDB: window.guardedIndexedDB,
          enabled: true,
          databaseName
        });
        return repo.commitTradeAtomically(request);
      },
      {databaseName, request: commitRequest}
    );
    assert.equal(replayAfterLostResponse.replayed, true);
    assert.deepEqual(replayAfterLostResponse.receipt, firstReceipt);
    const conflictingRetry = await pageA.evaluate(
      async ({databaseName, request}) => {
        const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
          indexedDB: window.guardedIndexedDB,
          enabled: true,
          databaseName
        });
        return repo.commitTradeAtomically({...request, proposalDigest: 'conflicting-digest'});
      },
      {databaseName, request: commitRequest}
    );
    assert.equal(conflictingRetry.committed, false);
    assert.equal(conflictingRetry.code, 'decision-binding-conflict');

    const competingKey = `${isolatedKey}-competing`;
    await pageA.evaluate(async ({databaseName, key, initial}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      await repo.initializeSnapshot(key, initial.state, initial.revision);
    }, {databaseName, key: competingKey, initial});
    const competingCommits = await Promise.all([pageA, pageB].map((page, index) =>
      page.evaluate(async ({databaseName, key, initial, decisionId}) => {
        const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
          indexedDB: window.guardedIndexedDB,
          enabled: true,
          databaseName
        });
        return repo.commitTradeAtomically({
          key,
          expectedRevision: initial.revision,
          decisionId,
          proposalDigest: `digest-${decisionId}`,
          receivingTeamId: 'B',
          candidateState: {
            ...initial.state,
            universe: {players: [{id: 'p1', teamId: decisionId}]},
            activity: {transactions: [{id: decisionId}]}
          }
        });
      }, {databaseName, key: competingKey, initial, decisionId: `competing-${index}`})
    ));
    assert.equal(competingCommits.filter(result => result.committed).length, 1);
    assert.equal(competingCommits.filter(result => result.code === 'stale-revision').length, 1);

    const staleTabCommit = await pageB.evaluate(async ({databaseName, isolatedKey, staleTabSnapshot}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      return repo.commitTradeAtomically({
        key: isolatedKey,
        expectedRevision: staleTabSnapshot.revision,
        decisionId: 'decision-2',
        proposalDigest: 'digest-2',
        receivingTeamId: 'B',
        candidateState: {...staleTabSnapshot.state, staleTabMutation: true}
      });
    }, {databaseName, isolatedKey, staleTabSnapshot});
    assert.equal(staleTabCommit.committed, false);
    assert.equal(staleTabCommit.code, 'stale-revision');

    const outcomes = await pageA.evaluate(async ({databaseName, isolatedKey, productionKey, commitRequest}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      const committed = await repo.readSnapshot(isolatedKey);
      const replay = await repo.commitTradeAtomically({
        ...commitRequest,
        candidateState: {...committed.state, replayMutation: true}
      });

      let failedWrite = false;
      try {
        await repo.commitTradeAtomically({
          key: isolatedKey,
          expectedRevision: committed.revision,
          decisionId: 'decision-abort',
          proposalDigest: 'digest-abort',
          receivingTeamId: 'B',
          candidateState: {...committed.state, uncloneable: () => {}}
        });
      } catch {
        failedWrite = true;
      }
      const afterAbort = await repo.readSnapshot(isolatedKey);
      const abortedDecisionConsumed = await repo.hasConsumedDecision('decision-abort');

      const beforeCancel = await repo.readSnapshot(isolatedKey);
      const userAction = 'cancel';
      if (userAction === 'approve') {
        await repo.commitTradeAtomically({
          key: isolatedKey,
          expectedRevision: beforeCancel.revision,
          decisionId: 'cancel-must-not-commit',
          proposalDigest: 'unused',
          receivingTeamId: 'B',
          candidateState: committed.state
        });
      }
      const afterCancel = await repo.readSnapshot(isolatedKey);

      let productionDatabaseRejected = false;
      try {
        window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
          indexedDB: window.guardedIndexedDB,
          enabled: true,
          databaseName: productionKey
        });
      } catch {
        productionDatabaseRejected = true;
      }
      return {
        committed,
        replay,
        failedWrite,
        afterAbort,
        abortedDecisionConsumed,
        beforeCancel,
        afterCancel,
        openedDatabases: window.openedDatabases,
        productionDatabaseRejected
      };
    }, {databaseName, isolatedKey, productionKey, commitRequest});

    assert.equal(outcomes.committed.revision, 'revision-1:trade:decision-1');
    assert.equal(outcomes.committed.state.universe.players[0].teamId, 'B');
    assert.deepEqual(outcomes.committed.state.activity.transactions, [{id: 'decision-1'}]);
    assert.equal(outcomes.replay.committed, true);
    assert.equal(outcomes.replay.replayed, true);
    assert.deepEqual(outcomes.replay.receipt, firstReceipt);
    assert.equal(outcomes.failedWrite, true);
    assert.deepEqual(outcomes.afterAbort, outcomes.committed);
    assert.equal(outcomes.abortedDecisionConsumed, false);
    assert.deepEqual(outcomes.afterCancel, outcomes.beforeCancel);
    assert.ok(outcomes.openedDatabases.length >= 1);
    assert.ok(outcomes.openedDatabases.every(name => name === databaseName));
    assert.equal(outcomes.productionDatabaseRejected, true);

    await pageA.reload();
    await pageA.addScriptTag({content: source});
    await installDatabaseGuard(pageA);
    const recovered = await pageA.evaluate(async ({databaseName, isolatedKey, request}) => {
      const repo = window.HLMExperimentalTradeIndexedDB.createExperimentalTradeIndexedDbRepository({
        indexedDB: window.guardedIndexedDB,
        enabled: true,
        databaseName
      });
      const snapshot = await repo.readSnapshot(isolatedKey);
      const retry = await repo.commitTradeAtomically(request);
      return {snapshot, retry};
    }, {databaseName, isolatedKey, request: commitRequest});
    assert.deepEqual(recovered.snapshot, outcomes.committed);
    assert.equal(recovered.retry.committed, true);
    assert.equal(recovered.retry.replayed, true);
    assert.deepEqual(recovered.retry.receipt, firstReceipt);

    const deleted = await pageA.evaluate(name => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Test database cleanup blocked'));
    }), databaseName);
    assert.equal(deleted, true);
    await context.close();
    console.log('Step 26 real-browser IndexedDB receipt idempotency, concurrent duplicate, stale-tab conflict, rollback, reload, cancellation and production isolation tests passed');
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
