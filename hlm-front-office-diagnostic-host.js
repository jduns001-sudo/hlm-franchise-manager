'use strict';

const DIAGNOSTIC_HOST_VERSION = 1;

function validateDiagnosticHost(host) {
  const errors = [];
  if (!host || typeof host !== 'object' || Array.isArray(host)) {
    return { valid: false, errors: ['Diagnostic host must be an object'] };
  }
  if (typeof host.readState !== 'function') errors.push('Diagnostic host requires readState');
  const forbidden = ['writeState', 'save', 'storage', 'indexedDB', 'database', 'db'];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(host, key)) {
      errors.push('Diagnostic host must not expose ' + key);
    }
  }
  return { valid: errors.length === 0, errors };
}

function createDiagnosticHost(readState) {
  if (typeof readState !== 'function') throw new TypeError('readState function is required');
  const host = Object.freeze({
    kind: 'front-office-diagnostic-host',
    version: DIAGNOSTIC_HOST_VERSION,
    readOnly: true,
    readState: async function () {
      const snapshot = await readState();
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        const error = new Error('Front Office state snapshot is invalid');
        error.code = 'INVALID_FRONT_OFFICE_SNAPSHOT';
        throw error;
      }
      return JSON.parse(JSON.stringify(snapshot));
    }
  });
  const validation = validateDiagnosticHost(host);
  if (!validation.valid) throw new Error(validation.errors.join('; '));
  return host;
}

module.exports = { DIAGNOSTIC_HOST_VERSION, createDiagnosticHost, validateDiagnosticHost };
