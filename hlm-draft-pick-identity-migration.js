'use strict';

const { pickNaturalKey } = require('./hlm-draft-pick-identity');

function sanitize(value) {
  return String(value).trim().replace(/[^A-Za-z0-9_-]+/g, '_');
}

function stableLegacyPickToken(pick, sourceIndex) {
  if (!pick || typeof pick !== 'object') throw Object.assign(new Error('Invalid DraftPick'), { code: 'INVALID_DRAFT_PICK' });
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0) throw Object.assign(new Error('Invalid source index'), { code: 'INVALID_SOURCE_INDEX' });
  const prototype = pick.pickId ?? pick.draftPickId ?? pick.id ?? '';
  return sanitize([pickNaturalKey(pick), prototype, sourceIndex].join('|'));
}

function migrateOperationalDraftPickIdentities(picks) {
  const source = Array.isArray(picks) ? picks : [];
  const seen = new Set();
  let changed = 0;
  const migrated = source.map((pick, index) => {
    const copy = JSON.parse(JSON.stringify(pick));
    const existing = copy.pickId;
    if (typeof existing === 'string' && /^PICK-[A-Za-z0-9_-]+$/.test(existing) && !seen.has(existing)) {
      seen.add(existing);
      return copy;
    }
    const id = 'PICK-' + stableLegacyPickToken(copy, index);
    if (seen.has(id)) throw Object.assign(new Error('DraftPick ID collision'), { code: 'DRAFT_PICK_ID_COLLISION' });
    copy.pickId = id;
    seen.add(id);
    changed += 1;
    return copy;
  });
  return { picks: migrated, changed, migrationProvenance: 'frozen-operational-legacy-collection' };
}

module.exports = { stableLegacyPickToken, migrateOperationalDraftPickIdentities };
