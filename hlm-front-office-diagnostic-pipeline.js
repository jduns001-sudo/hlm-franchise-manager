'use strict';

const { createDiagnosticHost } = require('./hlm-front-office-diagnostic-host');
const { normalizeFrontOfficeSnapshot } = require('./hlm-front-office-snapshot-normalizer');
const { auditFrontOfficeSnapshot } = require('./hlm-front-office-snapshot-audit');

function createFrontOfficeDiagnosticPipeline(readState) {
  const host = createDiagnosticHost(readState);

  return Object.freeze({
    kind: 'front-office-readonly-diagnostic-pipeline',
    version: 1,
    readOnly: true,
    persistenceEnabled: false,
    async run() {
      const source = await host.readState();
      const normalized = normalizeFrontOfficeSnapshot(source);
      const audit = auditFrontOfficeSnapshot(source);
      return Object.freeze({
        kind: 'front-office-readonly-diagnostic-report',
        version: 1,
        readOnly: true,
        persistenceEnabled: false,
        sourceSchema: normalized.sourceSchema,
        audit,
        snapshot: normalized
      });
    }
  });
}

module.exports = { createFrontOfficeDiagnosticPipeline };
