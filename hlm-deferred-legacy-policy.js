'use strict';

function resolveDeferredLegacyFields(legacy, state) {
  const source = legacy && typeof legacy === 'object' ? legacy : {};
  const next = JSON.parse(JSON.stringify(state));

  next.extensions = next.extensions && typeof next.extensions === 'object' ? next.extensions : {};
  next.extensions.legacy = next.extensions.legacy && typeof next.extensions.legacy === 'object'
    ? next.extensions.legacy : {};

  const preserved = {};
  for (const field of ['awards', 'draftClasses', 'gmSettings', 'snapshot', 'franchiseName']) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      preserved[field] = JSON.parse(JSON.stringify(source[field]));
    }
  }
  next.extensions.legacy.preserved = preserved;

  const controlledTeamId = source.gmSettings && source.gmSettings.controlledTeamId;
  if ((next.meta.controlledTeamId === null || next.meta.controlledTeamId === undefined) &&
      controlledTeamId !== null && controlledTeamId !== undefined) {
    next.meta.controlledTeamId = controlledTeamId;
  }

  return {
    state: next,
    preservedFields: Object.keys(preserved),
    policy: 'preserve-under-extensions-legacy',
    dataDiscarded: false
  };
}

module.exports = { resolveDeferredLegacyFields };
