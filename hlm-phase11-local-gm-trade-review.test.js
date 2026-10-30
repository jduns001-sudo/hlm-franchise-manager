'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const {renderLocalGmTradeReview} = require('./hlm-phase11-local-gm-trade-review');

const valid = () => ({
  authenticated: true,
  independentlyAuthenticated: true,
  experimental: true,
  settlementAuthorized: false,
  saved: false,
  status: 'receiving-consent-record-bridged',
  record: {decision: 'accepted'},
  proposalId: 'proposal-1',
  controlledTeamId: 'HOME',
  teamId: 'AWAY',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  assets: [
    {type: 'player', label: 'Player A', fromTeamId: 'HOME'},
    {type: 'pick', label: '2027 second round', fromTeamId: 'AWAY'}
  ]
});

test('renders only read-only verified experimental review', () => {
  const html = renderLocalGmTradeReview(valid());
  assert.match(html, /READ ONLY/);
  assert.match(html, /Player A/);
  assert.match(html, /2027 second round/);
  assert.doesNotMatch(html, /<script|<button|fetch\(/i);
});

test('rejects unauthenticated, unverified, saved or settling review', () => {
  for (const [key, value] of [
    ['authenticated', false], ['independentlyAuthenticated', false],
    ['experimental', false], ['settlementAuthorized', true],
    ['saved', true], ['status', 'unverified']
  ]) {
    const input = valid();
    input[key] = value;
    assert.throws(() => renderLocalGmTradeReview(input));
  }
});

test('rejects expired consent and missing source-backed assets', () => {
  const expired = valid();
  expired.expiresAt = new Date(Date.now() - 60000).toISOString();
  assert.throws(() => renderLocalGmTradeReview(expired));
  const noAssets = valid();
  noAssets.assets = [];
  assert.throws(() => renderLocalGmTradeReview(noAssets));
});

test('escapes untrusted text instead of injecting markup', () => {
  const input = valid();
  input.assets[0].label = '<img src=x onerror=alert(1)>';
  const html = renderLocalGmTradeReview(input);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img/);
});

test('rejects assets assigned to a third-party team', () => {
  const input = valid();
  input.assets[0].fromTeamId = 'OTHER';
  assert.throws(() => renderLocalGmTradeReview(input));
});
