'use strict';
/* Mission 1471: separate experimental IndexedDB only; never opens production saves. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HLMExperimentalTradeIndexedDB = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DATABASE_PREFIX = 'hlm-franchise-manager-experimental-trade-';
  const DEFAULT_DATABASE_NAME = `${DATABASE_PREFIX}v1`;
  const DATABASE_VERSION = 1;
  const FRANCHISE_STORE = 'isolatedFranchises';
  const DECISION_STORE = 'consumedDecisions';
  const ISOLATED_KEY_PREFIX = 'hlm-phase11-isolated-';
  const PRODUCTION_DATABASE_NAME = 'hlm_front_office_v8';
  const BINDING_SCHEMA = 'hlm-experimental-trade-settlement-binding-v1';
  const RECEIPT_SCHEMA = 'hlm-experimental-trade-settlement-receipt-v1';

  function createCanonicalBinding({
    key,
    expectedRevision,
    decisionId,
    proposalDigest,
    receivingTeamId,
    controlledTeamId
  }) {
    return {
      schema: BINDING_SCHEMA,
      key,
      expectedRevision,
      decisionId,
      proposalDigest,
      receivingTeamId,
      controlledTeamId
    };
  }

  function canonicalBindingJson(binding) {
    return JSON.stringify([
      binding.schema,
      binding.key,
      binding.expectedRevision,
      binding.decisionId,
      binding.proposalDigest,
      binding.receivingTeamId,
      binding.controlledTeamId
    ]);
  }

  function requireEnabled(enabled) {
    if (enabled !== true) throw new Error('Experimental IndexedDB repository is disabled');
  }

  function requireKey(key) {
    if (typeof key !== 'string' || !key.startsWith(ISOLATED_KEY_PREFIX)) {
      throw new TypeError('Namespaced isolated franchise key required');
    }
    return key;
  }

  function requireRevision(revision) {
    if (typeof revision !== 'string' || !revision) throw new TypeError('State revision required');
  }

  function openDatabase(indexedDB, databaseName) {
    return new Promise((resolve, reject) => {
      let request;
      let settled = false;
      try {
        request = indexedDB.open(databaseName, DATABASE_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FRANCHISE_STORE)) {
          db.createObjectStore(FRANCHISE_STORE, {keyPath: 'key'});
        }
        if (!db.objectStoreNames.contains(DECISION_STORE)) {
          db.createObjectStore(DECISION_STORE, {keyPath: 'decisionId'});
        }
      };
      request.onsuccess = () => {
        if (settled) request.result.close();
        else {
          settled = true;
          resolve(request.result);
        }
      };
      request.onerror = () => {
        if (settled) return;
        settled = true;
        reject(request.error || new Error('Experimental IndexedDB open failed'));
      };
      request.onblocked = () => {
        if (settled) return;
        settled = true;
        reject(new Error('Experimental IndexedDB upgrade blocked'));
      };
    });
  }

  function runTransaction(db, stores, mode, work) {
    return new Promise((resolve, reject) => {
      let tx;
      let result;
      let failure;
      try {
        tx = db.transaction(stores, mode);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => {
          failure = failure || tx.error || new Error('Experimental IndexedDB transaction failed');
        };
        tx.onabort = () => reject(failure || tx.error || new Error('Experimental IndexedDB transaction aborted'));
        work(tx, value => { result = value; }, error => {
          failure = error;
          try { tx.abort(); } catch (abortError) { reject(failure || abortError); }
        });
      } catch (error) {
        if (tx) {
          failure = error;
          try { tx.abort(); } catch (abortError) { reject(error || abortError); }
        } else {
          reject(error);
        }
      }
    });
  }

  function withTransaction(indexedDB, databaseName, stores, mode, work) {
    return openDatabase(indexedDB, databaseName).then(db =>
      runTransaction(db, stores, mode, work).finally(() => db.close()));
  }

  function createExperimentalTradeIndexedDbRepository({
    indexedDB = typeof globalThis !== 'undefined' ? globalThis.indexedDB : null,
    enabled = false,
    databaseName = DEFAULT_DATABASE_NAME
  } = {}) {
    if (!indexedDB || typeof indexedDB.open !== 'function') throw new TypeError('IndexedDB API required');
    if (enabled !== false && enabled !== true) throw new TypeError('Invalid experimental enable flag');
    if (typeof databaseName !== 'string' || !databaseName.startsWith(DATABASE_PREFIX) ||
        databaseName === PRODUCTION_DATABASE_NAME) {
      throw new TypeError('Dedicated experimental trade database name required');
    }

    return Object.freeze({
      async initializeSnapshot(key, state, revision) {
        requireEnabled(enabled);
        requireKey(key);
        requireRevision(revision);
        if (!state || typeof state !== 'object' || Array.isArray(state)) {
          throw new TypeError('Isolated GameState object required');
        }
        return withTransaction(indexedDB, databaseName, [FRANCHISE_STORE], 'readwrite',
          (tx, setResult, fail) => {
            const request = tx.objectStore(FRANCHISE_STORE).add({key, state, revision});
            request.onsuccess = () => setResult(true);
            request.onerror = () => fail(request.error || new Error('Isolated snapshot initialization failed'));
          });
      },

      async readSnapshot(key) {
        requireEnabled(enabled);
        requireKey(key);
        return withTransaction(indexedDB, databaseName, [FRANCHISE_STORE], 'readonly',
          (tx, setResult, fail) => {
            const request = tx.objectStore(FRANCHISE_STORE).get(key);
            request.onsuccess = () => {
              const record = request.result;
              setResult(record ? {state: record.state, revision: record.revision} : null);
            };
            request.onerror = () => fail(request.error || new Error('Isolated snapshot lookup failed'));
          });
      },

      async commitTradeAtomically({
        key,
        expectedRevision,
        decisionId,
        proposalDigest,
        receivingTeamId,
        controlledTeamId,
        consentEnvelope,
        settledAt,
        candidateState
      } = {}) {
        requireEnabled(enabled);
        requireKey(key);
        requireRevision(expectedRevision);
        if (typeof decisionId !== 'string' || !decisionId ||
            typeof proposalDigest !== 'string' || !proposalDigest ||
            typeof receivingTeamId !== 'string' || !receivingTeamId ||
            (settledAt !== undefined &&
              (typeof settledAt !== 'string' ||
               !Number.isFinite(Date.parse(settledAt)) ||
               new Date(Date.parse(settledAt)).toISOString() !== settledAt)) ||
            !candidateState || typeof candidateState !== 'object' || Array.isArray(candidateState)) {
          throw new TypeError('Complete isolated trade commit required');
        }
        return withTransaction(indexedDB, databaseName,
          [FRANCHISE_STORE, DECISION_STORE], 'readwrite', (tx, setResult, fail) => {
            const franchises = tx.objectStore(FRANCHISE_STORE);
            const decisions = tx.objectStore(DECISION_STORE);
            const currentRequest = franchises.get(key);
            currentRequest.onsuccess = () => {
              const current = currentRequest.result;
              const decisionRequest = decisions.get(decisionId);
              decisionRequest.onsuccess = () => {
                const existing = decisionRequest.result;
                const binding = createCanonicalBinding({
                  key,
                  expectedRevision,
                  decisionId,
                  proposalDigest,
                  receivingTeamId,
                  controlledTeamId: String(controlledTeamId ?? candidateState.meta?.controlledTeamId ?? '')
                });
                const bindingJson = canonicalBindingJson(binding);
                const consentEnvelopeJson = consentEnvelope === undefined
                  ? undefined
                  : JSON.stringify(consentEnvelope);
                const committedRevision = `${expectedRevision}:trade:${decisionId}`;
                const receipt = {
                  schema: RECEIPT_SCHEMA,
                  decisionId,
                  key,
                  proposalDigest,
                  receivingTeamId,
                  controlledTeamId: binding.controlledTeamId,
                  expectedRevision,
                  committedRevision,
                  canonicalBinding: binding,
                  ...(settledAt === undefined ? {} : {settledAt})
                };
                if (existing) {
                  if (existing.canonicalBinding !== bindingJson ||
                      JSON.stringify(existing.receipt) !== JSON.stringify(receipt) ||
                      existing.consentEnvelopeJson !== consentEnvelopeJson) {
                    setResult({committed: false, code: 'decision-binding-conflict'});
                    return;
                  }
                  setResult({
                    committed: true,
                    replayed: true,
                    receipt: existing.receipt
                  });
                  return;
                }
                if (!current || current.revision !== expectedRevision) {
                  setResult({committed: false, code: 'stale-revision'});
                  return;
                }
                const addDecision = decisions.add({
                  decisionId,
                  key,
                  proposalDigest,
                  receivingTeamId,
                  stateRevision: expectedRevision,
                  canonicalBinding: bindingJson,
                  ...(consentEnvelopeJson === undefined ? {} : {
                    consentEnvelope,
                    consentEnvelopeJson
                  }),
                  receipt
                });
                addDecision.onerror = () => {
                  fail(addDecision.error || new Error('Decision replay guard failed'));
                };
                addDecision.onsuccess = () => {
                  const putSnapshot = franchises.put({
                    key,
                    state: candidateState,
                    revision: committedRevision
                  });
                  putSnapshot.onerror = () => {
                    fail(putSnapshot.error || new Error('Atomic snapshot write failed'));
                  };
                  putSnapshot.onsuccess = () => setResult({
                    committed: true,
                    replayed: false,
                    receipt
                  });
                };
              };
              decisionRequest.onerror = () => {
                fail(decisionRequest.error || new Error('Decision replay lookup failed'));
              };
            };
            currentRequest.onerror = () => {
              fail(currentRequest.error || new Error('Current snapshot lookup failed'));
            };
          });
      },

      async hasConsumedDecision(decisionId) {
        requireEnabled(enabled);
        if (typeof decisionId !== 'string' || !decisionId) throw new TypeError('Decision ID required');
        return withTransaction(indexedDB, databaseName, [DECISION_STORE], 'readonly',
          (tx, setResult, fail) => {
            const request = tx.objectStore(DECISION_STORE).get(decisionId);
            request.onsuccess = () => setResult(Boolean(request.result));
            request.onerror = () => fail(request.error || new Error('Decision lookup failed'));
          });
      },

      async getTradeReceipt(decisionId) {
        requireEnabled(enabled);
        if (typeof decisionId !== 'string' || !decisionId) {
          throw new TypeError('Decision ID required');
        }
        return withTransaction(indexedDB, databaseName, [DECISION_STORE], 'readonly',
          (tx, setResult, fail) => {
            const request = tx.objectStore(DECISION_STORE).get(decisionId);
            request.onsuccess = () => setResult(request.result || null);
            request.onerror = () => fail(request.error || new Error('Trade receipt lookup failed'));
          });
      }
    });
  }

  return Object.freeze({
    DATABASE_PREFIX,
    DEFAULT_DATABASE_NAME,
    FRANCHISE_STORE,
    DECISION_STORE,
    createExperimentalTradeIndexedDbRepository
  });
});
