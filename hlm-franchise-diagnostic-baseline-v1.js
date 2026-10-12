'use strict';

/**
 * Mission 674: independently maintained v1 diagnostic expectations.
 * These are deliberate contract assertions, not runtime-generated snapshots.
 * requiredErrorCodes and requiredReadinessCodes are subsets: additional
 * diagnostics are permitted unless the baseline explicitly fixes a count.
 */
const FRANCHISE_DIAGNOSTIC_BASELINE_V1 = Object.freeze({
  kind: 'franchise-diagnostic-expected-baseline',
  version: 1,
  matrixVersion: 1,
  fixtureNames: Object.freeze(['clean', 'invalidIdentities', 'unresolvedOrganizations', 'mixedRoster']),
  expectations: Object.freeze({
    clean: Object.freeze({
      dataQualityValid: true,
      teamCount: 2,
      candidateCount: 2,
      unresolvedPlayerCount: 0,
      requiredErrorCodes: Object.freeze([]),
      requiredReadinessCodes: Object.freeze(['ROSTER_REQUIREMENTS_NOT_DEFINED'])
    }),
    invalidIdentities: Object.freeze({
      dataQualityValid: false,
      teamCount: 1,
      candidateCount: 1,
      requiredErrorCodes: Object.freeze(['DUPLICATE_UNIVERSE_PLAYER_ID', 'INVALID_UNIVERSE_PLAYER', 'ROSTER_PLAYER_MISSING_UNIVERSE']),
      requiredReadinessCodes: Object.freeze([])
    }),
    unresolvedOrganizations: Object.freeze({
      dataQualityValid: false,
      teamCount: 1,
      candidateCount: 1,
      unresolvedPlayerCount: 4,
      unresolvedOrganizationWarningCount: 4,
      requiredErrorCodes: Object.freeze(['UNRESOLVED_PLAYER_TEAM_REFERENCE']),
      requiredReadinessCodes: Object.freeze(['UNRESOLVED_PLAYER_ORGANIZATION'])
    }),
    mixedRoster: Object.freeze({
      teamCount: 2,
      candidateCount: 2,
      unresolvedPlayerCount: 2,
      unresolvedOrganizationWarningCount: 2,
      requiredErrorCodes: Object.freeze([]),
      requiredReadinessCodes: Object.freeze(['RETIRED_ASSOCIATED_PLAYERS', 'UNRESOLVED_PLAYER_ORGANIZATION'])
    })
  })
});

module.exports = { FRANCHISE_DIAGNOSTIC_BASELINE_V1 };
