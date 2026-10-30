'use strict';

// Local development only. The caller must authenticate the session and independently
// verify consent before supplying a view model. This renderer never settles trades.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderLocalGmTradeReview(review) {
  if (!review || review.authenticated !== true ||
      review.independentlyAuthenticated !== true ||
      review.experimental !== true ||
      review.settlementAuthorized !== false ||
      review.saved !== false ||
      review.status !== 'receiving-consent-record-bridged' ||
      !review.record || review.record.decision !== 'accepted') {
    throw new Error('Verified, authenticated experimental consent required');
  }
  const {proposalId, controlledTeamId, teamId, expiresAt} = review;
  for (const field of [proposalId, controlledTeamId, teamId, expiresAt]) {
    if (typeof field !== 'string' || !field.trim() || field.length > 256) {
      throw new Error('Missing authoritative review field');
    }
  }
  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    throw new Error('Consent expired or invalid');
  }
  const assets = review.assets;
  if (!Array.isArray(assets) || assets.length === 0 || assets.length > 40 ||
      assets.some(asset => !asset || typeof asset !== 'object' ||
        !['player', 'pick'].includes(asset.type) ||
        typeof asset.label !== 'string' || !asset.label.trim() ||
        asset.label.length > 160 ||
        ![controlledTeamId, teamId].includes(asset.fromTeamId))) {
    throw new Error('Source-backed assets required');
  }
  const rows = assets.map(asset =>
    '<li>' + escapeHtml(asset.fromTeamId) + ' sends ' +
    escapeHtml(asset.type) + ': ' + escapeHtml(asset.label) + '</li>').join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Local GM Trade Review</title>
<style>body{font:16px system-ui;background:#07111f;color:#eef5ff;margin:0;padding:16px}
main{max-width:720px;margin:auto}section{border:1px solid #29415f;border-radius:12px;padding:16px;margin:12px 0}
li{margin:8px 0}p{overflow-wrap:anywhere}</style></head><body><main>
<h1>Local experimental GM Trade Review</h1>
<p><strong>READ ONLY · NO TRADE EXECUTED · NOT PRODUCTION</strong></p>
<section><h2>Verified CPU consent</h2><p>Proposal: ${escapeHtml(proposalId)}</p>
<p>Teams: ${escapeHtml(controlledTeamId)} and ${escapeHtml(teamId)}</p>
<p>CPU decision: Accepted for review, not GM-approved</p>
<p>Consent expires: ${escapeHtml(expiresAt)}</p></section>
<section><h2>Source-backed proposed assets</h2><ul>${rows}</ul></section>
<section><h2>Human GM decision</h2><p>Approval, decline, cancellation and settlement are not enabled on this page.</p>
<p>Review the proposal in the isolated development harness. Nothing is saved here.</p></section>
</main></body></html>`;
}

module.exports = {renderLocalGmTradeReview};
