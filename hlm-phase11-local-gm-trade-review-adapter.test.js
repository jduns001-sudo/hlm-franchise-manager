'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {renderAuthenticatedLocalTradeReview} = require('./hlm-phase11-local-gm-trade-review-adapter');

function fixture() {
  const envelope = {
    proposalId: 'p-1', stateRevision: 'r-1',
    controlledTeamId: 'HOME', teamId: 'AWAY',
    expiresAt: new Date(Date.now() + 60000).toISOString()
  };
  const source = {
    proposalId: 'p-1', stateRevision: 'r-1',
    controlledTeamId: 'HOME', teamId: 'AWAY',
    assets: [{type: 'player', label: 'Player A', fromTeamId: 'HOME'}]
  };
  const bridgeResult = {
    status: 'receiving-consent-record-bridged',
    independentlyAuthenticated: true,
    saved: false,
    settlementAuthorized: false,
    experimental: true,
    record: {decision: 'accepted'}
  };
  return {
    authenticatedSession: true, envelope, bridgeResult,
    resolveAuthoritativeReview: async () => source
  };
}

test('renders verified review using only server-resolved assets', async () => {
  const html = await renderAuthenticatedLocalTradeReview(fixture());
  assert.match(html, /Player A/);
  assert.match(html, /READ ONLY/);
  assert.doesNotMatch(html, /<button|<script/i);
});

test('rejects missing session, bridge verification and settlement flags', async () => {
  for (const [key, value] of [
    ['authenticatedSession', false],
    ['bridgeResult', null]
  ]) {
    const input = fixture();
    input[key] = value;
    await assert.rejects(renderAuthenticatedLocalTradeReview(input));
  }
  for (const [key, value] of [
    ['independentlyAuthenticated', false], ['saved', true],
    ['settlementAuthorized', true], ['experimental', false]
  ]) {
    const input = fixture();
    input.bridgeResult[key] = value;
    await assert.rejects(renderAuthenticatedLocalTradeReview(input));
  }
});

test('rejects stale or mismatched server proposal', async () => {
  const input = fixture();
  input.resolveAuthoritativeReview = async () => ({
    proposalId: 'other', stateRevision: 'r-1',
    controlledTeamId: 'HOME', teamId: 'AWAY', assets: []
  });
  await assert.rejects(renderAuthenticatedLocalTradeReview(input));
});

test('rejects resolver absence and expired consent', async () => {
  const missing = fixture();
  missing.resolveAuthoritativeReview = undefined;
  await assert.rejects(renderAuthenticatedLocalTradeReview(missing));
  const expired = fixture();
  expired.envelope.expiresAt = new Date(Date.now() - 1000).toISOString();
  await assert.rejects(renderAuthenticatedLocalTradeReview(expired));
});
