'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {chromium} = require('playwright');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createLocalCpuConsentAuthority} = require('./hlm-phase11-local-cpu-consent-authority');
const {createCpuTradeEvaluationPolicy} = require('./hlm-phase11-cpu-trade-evaluation-policy');
const {createReceivingConsentRecordBridge} = require('./hlm-phase11-receiving-consent-record-bridge');

const REVISION = 'coordinator-browser-revision-1';
const KEY = 'hlm-phase11-isolated-coordinator-browser';
const DATABASE = `hlm-franchise-manager-experimental-trade-step45-${process.pid}`;
const PROPOSAL = {
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
};
const PROPOSAL_IDS = ['browser-coordinator-proposal-a', 'browser-coordinator-proposal-b'];
const MODULES = [
  'hlm-game-state.js',
  'hlm-phase11-experimental-trade-coordinator.js',
  'hlm-phase11-isolated-trade-settlement-transaction.js',
  'hlm-phase11-integrated-player-pick-trade.js',
  'hlm-phase11-guarded-player-trade.js',
  'hlm-phase11-trade-financial-eligibility.js',
  'hlm-phase11-trade-restrictions.js',
  'hlm-phase11-isolated-trade-decision.js',
  'hlm-phase11-draft-pick-trade-readiness.js',
  'hlm-phase11-protected-cpu-consent-contract.js',
  'hlm-phase11-trade-proposal-digest.js',
  'hlm-phase11-experimental-trade-indexeddb.js'
];
const SOURCES = Object.fromEntries(MODULES.map(file => [
  file,
  fs.readFileSync(path.join(__dirname, file), 'utf8')
]));

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'coordinator-browser-only', controlledTeamId: 'A', currentDate: '2027-01-02'},
    teams: [{id: 'A'}, {id: 'B'}],
    players: [
      {id: 'p1', teamId: 'A', position: 'C', age: 26, ovr: 80, potential: 80},
      {id: 'p2', teamId: 'B', position: 'C', age: 26, ovr: 70, potential: 70}
    ],
    contracts: [
      {playerId: 'p1', teamId: 'A', status: 'active', aav: 1, tradePermission: 'allowed'},
      {playerId: 'p2', teamId: 'B', status: 'active', aav: 1, tradePermission: 'allowed'}
    ],
    draftPicks: [
      {id: 'pick1', year: 2027, round: 1, originalTeamId: 'A', teamId: 'A'},
      {id: 'pick2', year: 2028, round: 1, originalTeamId: 'B', teamId: 'B'}
    ],
    finances: {teamCapLimits: {A: 100, B: 100}},
    extensions: {tradeRosterLimits: {A: 10, B: 10}}
  });
}

function loaderScript() {
  return `(() => {
    const sources = ${JSON.stringify(SOURCES)};
    const cache = Object.create(null);
    function load(request) {
      const name = request.replace(/^\\.\\//, '').replace(/\\.js$/, '') + '.js';
      if (cache[name]) return cache[name].exports;
      if (!sources[name]) throw new Error('Unlisted test module: ' + name);
      const module = {exports: {}};
      cache[name] = module;
      new Function('require', 'module', 'exports', sources[name])(
        dependency => load(dependency), module, module.exports
      );
      return module.exports;
    }
    window.CoordinatorModules = Object.fromEntries(
      Object.keys(sources).map(name => [name, load(name)])
    );
  })();`;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, value) {
  response.writeHead(status, {'content-type': 'application/json', 'cache-control': 'no-store'});
  response.end(JSON.stringify(value));
}

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-coordinator-browser-'));
  const state = fixture();
  const policy = createCpuTradeEvaluationPolicy({enabled: true});
  const authority = createLocalCpuConsentAuthority({
    enabled: true,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem'),
    policy,
    now: () => new Date('2027-01-02T12:00:00.000Z')
  });
  let authorityServer;
  let server;
  let browser;
  try {
    authorityServer = await authority.start();
    for (const proposalId of PROPOSAL_IDS) {
      authority.registerAuthoritativeProposal({
        proposalId,
        state,
        proposal: proposalId === PROPOSAL_IDS[0]
          ? PROPOSAL
          : {...PROPOSAL, picks: [
            ...PROPOSAL.picks,
            {pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}
          ]},
        stateRevision: REVISION
      });
    }
    const consumed = new Set();
    const bridge = createReceivingConsentRecordBridge({
      enabled: true,
      publicKey: authority.publicKey,
      keyId: authority.keyId,
      ledger: {async consumeOnce(id) {
        if (consumed.has(id)) return false;
        consumed.add(id);
        return true;
      }},
      now: () => new Date('2027-01-02T12:00:01.000Z')
    });
    server = http.createServer(async (request, response) => {
      try {
        if (request.method === 'GET' && request.url === '/') {
          response.writeHead(200, {'content-type': 'text/html'});
          return response.end('<!doctype html><title>Step 45 isolated coordinator test</title>');
        }
        const body = await readJson(request);
        if (request.method !== 'POST' || !body) return sendJson(response, 404, {error: 'not-found'});
        if (request.url === '/issue') {
          const issued = await fetch(authorityServer.url, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${authorityServer.apiToken}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          return sendJson(response, issued.status, await issued.json());
        }
        if (request.url === '/bridge') {
          const result = await bridge.review(
            body.state, body.proposal, body.revision, body.envelope
          );
          return sendJson(response, 200, result);
        }
        return sendJson(response, 404, {error: 'not-found'});
      } catch {
        return sendJson(response, 500, {error: 'local-test-harness-failure'});
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext();
    const pageA = await context.newPage();
    await pageA.goto(origin);
    await pageA.addScriptTag({content: loaderScript()});
    assert.equal(await pageA.evaluate(() => typeof window.CoordinatorModules), 'object');
    await pageA.evaluate(async ({databaseName, key, state, origin, publicKey}) => {
      window.openedDatabases = [];
      const guardedIndexedDB = {
        open(name, version) {
          window.openedDatabases.push(name);
          if (!name.startsWith('hlm-franchise-manager-experimental-trade-')) {
            throw new Error(`Unexpected database access: ${name}`);
          }
          return indexedDB.open(name, version);
        }
      };
      const repository = CoordinatorModules['hlm-phase11-experimental-trade-indexeddb.js']
        .createExperimentalTradeIndexedDbRepository({
          indexedDB: guardedIndexedDB,
          databaseName,
          enabled: true
        });
      await repository.initializeSnapshot(key, state, 'coordinator-browser-revision-1');
      window.makeCoordinator = () => {
        const pem = publicKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        const bytes = Uint8Array.from(atob(pem), character => character.charCodeAt(0));
        const verifier = {
          async verify(envelope) {
            const {signature, ...payload} = envelope;
            const keyHandle = await crypto.subtle.importKey(
              'spki', bytes, {name: 'Ed25519'}, false, ['verify']
            );
            const {canonicalJson} = CoordinatorModules['hlm-phase11-trade-proposal-digest.js'];
            return crypto.subtle.verify(
              {name: 'Ed25519'},
              keyHandle,
              Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
              new TextEncoder().encode(canonicalJson(payload))
            );
          }
        };
        return CoordinatorModules['hlm-phase11-experimental-trade-coordinator.js']
          .createExperimentalTradeCoordinator({
            enabled: true,
            key,
            repository,
            authority: {
              async issueConsent(proposalId, expectedRevision) {
                const response = await fetch(`${origin}/issue`, {
                  method: 'POST',
                  headers: {'content-type': 'application/json'},
                  body: JSON.stringify({proposalId, expectedRevision})
                });
                return {statusCode: response.status, body: await response.json()};
              }
            },
            bridge: {
              async review(stateSnapshot, proposal, revision, envelope) {
                const response = await fetch(`${origin}/bridge`, {
                  method: 'POST',
                  headers: {'content-type': 'application/json'},
                  body: JSON.stringify({state: stateSnapshot, proposal, revision, envelope})
                });
                return response.json();
              }
            },
            consentVerifier: verifier,
            now: () => new Date('2027-01-02T12:00:02.000Z')
          });
      };
      window.guardedRepository = CoordinatorModules[
        'hlm-phase11-experimental-trade-indexeddb.js'
      ].createExperimentalTradeIndexedDbRepository({
        indexedDB: guardedIndexedDB,
        databaseName,
        enabled: true
      });
    }, {
      databaseName: DATABASE,
      key: KEY,
      state,
      origin,
      publicKey: authority.publicKey
    });

    const pageB = await context.newPage();
    await pageB.goto(origin);
    await pageB.addScriptTag({content: loaderScript()});
    const pending = await pageA.evaluate(async () => {
      const coordinator = window.makeCoordinator();
      const result = await coordinator.review('browser-coordinator-proposal-a', {
        outgoingPlayerId: 'p1',
        incomingPlayerId: 'p2',
        picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
      });
      window.pendingCoordinator = coordinator;
      return result;
    });
    assert.equal(pending.status, 'awaiting-human-gm-approval');

    await pageB.evaluate(async ({databaseName, key, state, origin, publicKey}) => {
      const guardedIndexedDB = {
        open(name, version) {
          if (!name.startsWith('hlm-franchise-manager-experimental-trade-')) {
            throw new Error(`Unexpected database access: ${name}`);
          }
          return indexedDB.open(name, version);
        }
      };
      const repository = CoordinatorModules['hlm-phase11-experimental-trade-indexeddb.js']
        .createExperimentalTradeIndexedDbRepository({
          indexedDB: guardedIndexedDB,
          databaseName,
          enabled: true
        });
      window.staleSnapshot = await repository.readSnapshot(key);
      const pem = publicKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
      const bytes = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
      const verifier = {async verify(envelope) {
        const {signature, ...payload} = envelope;
        const keyHandle = await crypto.subtle.importKey('spki', bytes, {name: 'Ed25519'},
          false, ['verify']);
        const {canonicalJson} = CoordinatorModules['hlm-phase11-trade-proposal-digest.js'];
        const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
          c => c.charCodeAt(0));
        return crypto.subtle.verify({name: 'Ed25519'}, keyHandle, sig,
          new TextEncoder().encode(canonicalJson(payload)));
      }};
      window.staleCoordinator = CoordinatorModules[
        'hlm-phase11-experimental-trade-coordinator.js'
      ].createExperimentalTradeCoordinator({
        enabled: true,
        key,
        repository,
        authority: {async issueConsent(proposalId, expectedRevision) {
          const response = await fetch(`${origin}/issue`, {
            method: 'POST', headers: {'content-type': 'application/json'},
            body: JSON.stringify({proposalId, expectedRevision})
          });
          return {statusCode: response.status, body: await response.json()};
        }},
        bridge: {async review(stateSnapshot, proposal, revision, envelope) {
          const response = await fetch(`${origin}/bridge`, {
            method: 'POST', headers: {'content-type': 'application/json'},
            body: JSON.stringify({state: stateSnapshot, proposal, revision, envelope})
          });
          return response.json();
        }},
        consentVerifier: verifier,
        now: () => new Date('2027-01-02T12:00:02.000Z')
      });
      const staleReview = await window.staleCoordinator.review('browser-coordinator-proposal-b', {
        outgoingPlayerId: 'p1',
        incomingPlayerId: 'p2',
        picks: [
          {pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'},
          {pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}
        ]
      });
      window.stalePending = staleReview;
      return staleReview;
    }, {databaseName: DATABASE, key: KEY, state, origin, publicKey: authority.publicKey});
    assert.equal(await pageB.evaluate(() => window.stalePending.status),
      'awaiting-human-gm-approval',
      JSON.stringify(await pageB.evaluate(() => window.stalePending)));

    const committed = await pageA.evaluate(() => window.pendingCoordinator.decide('approve'));
    assert.equal(committed.status, 'isolated-trade-candidate-committed');
    assert.equal(committed.receipt.schema, 'hlm-experimental-trade-settlement-receipt-v1');
    assert.equal(committed.receipt.canonicalBinding.controlledTeamId, 'A');
    const stale = await pageB.evaluate(() => window.staleCoordinator.decide('approve'));
    assert.equal(stale.code, 'stale-review');

    const reloaded = await pageA.evaluate(async () => {
      const coordinator = window.makeCoordinator();
      const recovered = await coordinator.review('browser-coordinator-proposal-a', {
        outgoingPlayerId: 'p1',
        incomingPlayerId: 'p2',
        picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
      });
      const snapshot = await window.guardedRepository.readSnapshot('hlm-phase11-isolated-coordinator-browser');
      const receipt = await window.guardedRepository.getTradeReceipt(recovered.decisionId);
      return {recovered, snapshot, receipt, openedDatabases: window.openedDatabases};
    });
    assert.equal(reloaded.recovered.replayed, true);
    assert.deepEqual(reloaded.recovered.receipt, committed.receipt);
    assert.equal(reloaded.snapshot.state.activity.transactions.length, 1);
    assert.equal(reloaded.snapshot.state.activity.transactions[0].humanGMApproved, true);
    assert.equal(reloaded.snapshot.state.extensions?.tradeDecisionConsents, undefined);
    assert.equal(reloaded.receipt.consentEnvelope.signature.length > 0, true);
    assert.ok(reloaded.openedDatabases.length >= 1);
    assert.ok(reloaded.openedDatabases.every(name => name === DATABASE));

    const productionRejected = await pageA.evaluate(() => {
      try {
        CoordinatorModules['hlm-phase11-experimental-trade-indexeddb.js']
          .createExperimentalTradeIndexedDbRepository({
            indexedDB,
            enabled: true,
            databaseName: 'hlm_front_office_v8'
          });
      } catch {
        return true;
      }
      return false;
    });
    assert.equal(productionRejected, true);

    await pageA.evaluate(name => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Experimental coordinator DB deletion blocked'));
    }), DATABASE);
    await context.close();
    console.log('Step 45 Chromium coordinator, consent, GM approval, stale-tab and receipt-recovery checks passed');
  } finally {
    if (browser) await browser.close();
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await authority.close();
    fs.rmSync(directory, {recursive: true, force: true});
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
