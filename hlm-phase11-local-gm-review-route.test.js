'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {createLocalCpuConsentGateway} = require('./hlm-phase11-local-cpu-consent-gateway');

test('read-only review endpoint is opt-in and rejects unconfigured access', async t => {
  const service = createLocalCpuConsentGateway({
    enabled: true,
    authority: {issueConsent: async () => ({statusCode: 404})}
  });
  const endpoint = await service.start();
  t.after(() => service.close());
  assert.equal(endpoint.reviewPath, null);
  const result = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: endpoint.port, path: '/v1/review',
      method: 'POST', headers: {
        host: 'localhost:' + endpoint.port,
        origin: endpoint.url, 'sec-fetch-site': 'same-origin',
        'content-type': 'application/json'
      }
    }, res => {res.resume();res.on('end', () => resolve(res.statusCode));});
    req.on('error', reject);
    req.end();
  });
  assert.equal(result, 404);
});

test('review endpoint requires both trusted resolvers and bridge', () => {
  assert.throws(() => createLocalCpuConsentGateway({
    enabled: true,
    authority: {issueConsent: async () => ({statusCode: 404})},
    resolveAuthoritativeReview: async () => ({})
  }), /trusted bridge/);
});
