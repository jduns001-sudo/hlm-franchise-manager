'use strict';

const SUPPORTED_FRONT_OFFICE_SCHEMAS = Object.freeze([7]);

function evaluateFrontOfficeRuntimeCompatibility(report) {
  const reasons = [];
  if (!report || typeof report !== 'object') {
    return Object.freeze({ compatible: false, reasons: Object.freeze(['Diagnostic report is required']) });
  }
  if (report.readOnly !== true || report.persistenceEnabled !== false) {
    reasons.push('Diagnostic report must remain read-only with persistence disabled');
  }
  if (!SUPPORTED_FRONT_OFFICE_SCHEMAS.includes(report.sourceSchema)) {
    reasons.push('Unsupported Front Office schema: ' + String(report.sourceSchema));
  }
  if (!report.audit || report.audit.readyForReadOnlyDiagnostics !== true) {
    reasons.push('Snapshot audit is not ready for read-only diagnostics');
  }
  return Object.freeze({
    kind: 'front-office-runtime-compatibility',
    version: 1,
    compatible: reasons.length === 0,
    supportedSchemas: SUPPORTED_FRONT_OFFICE_SCHEMAS,
    sourceSchema: report.sourceSchema == null ? null : report.sourceSchema,
    reasons: Object.freeze(reasons)
  });
}

module.exports = { SUPPORTED_FRONT_OFFICE_SCHEMAS, evaluateFrontOfficeRuntimeCompatibility };
