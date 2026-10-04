'use strict';

const MIGRATION_EVENT_TYPES = Object.freeze({
  REQUESTED: 'LEGACY_MIGRATION_REQUESTED',
  BLOCKED: 'LEGACY_MIGRATION_BLOCKED',
  COMPLETED: 'LEGACY_MIGRATION_COMPLETED',
  FAILED: 'LEGACY_MIGRATION_FAILED'
});

function migrationEvent(type, details = {}) {
  if (!Object.values(MIGRATION_EVENT_TYPES).includes(type)) throw new Error('Invalid migration event type');
  return Object.freeze({ type, details: { ...details } });
}

function migrationEventsForResult(command, result) {
  const events = [migrationEvent(MIGRATION_EVENT_TYPES.REQUESTED, { slotId: command.slotId })];
  if (!result || result.executed !== true) {
    events.push(migrationEvent(MIGRATION_EVENT_TYPES.BLOCKED, { slotId: command.slotId, reason: result && result.reason ? result.reason : 'NOT_EXECUTED' }));
  } else {
    events.push(migrationEvent(MIGRATION_EVENT_TYPES.COMPLETED, { slotId: command.slotId, verified: result.verified === true, legacySourcePreserved: result.legacySourcePreserved === true }));
  }
  return events;
}

function migrationFailureEvent(command, error) {
  return migrationEvent(MIGRATION_EVENT_TYPES.FAILED, { slotId: command && command.slotId || null, code: error && error.code || 'MIGRATION_FAILED' });
}

module.exports = { MIGRATION_EVENT_TYPES, migrationEvent, migrationEventsForResult, migrationFailureEvent };
