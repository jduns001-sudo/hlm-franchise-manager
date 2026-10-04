'use strict';

const { createFrontOfficeDiagnosticPipeline } = require('./hlm-front-office-diagnostic-pipeline');
const { evaluateFrontOfficeRuntimeCompatibility } = require('./hlm-front-office-runtime-compatibility');

function createFrontOfficeReadOnlySession(readState) {
  const pipeline = createFrontOfficeDiagnosticPipeline(readState);

  return Object.freeze({
    kind: 'front-office-readonly-runtime-session',
    version: 1,
    readOnly: true,
    persistenceEnabled: false,
    async inspect() {
      const report = await pipeline.run();
      const compatibility = evaluateFrontOfficeRuntimeCompatibility(report);
      return Object.freeze({
        kind: 'front-office-readonly-session-inspection',
        version: 1,
        readOnly: true,
        persistenceEnabled: false,
        compatible: compatibility.compatible,
        compatibility,
        audit: report.audit,
        snapshot: report.snapshot
      });
    }
  });
}

module.exports = { createFrontOfficeReadOnlySession };
