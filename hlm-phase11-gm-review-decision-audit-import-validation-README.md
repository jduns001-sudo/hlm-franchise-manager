# Mission 1203: GM review decision audit import validation

Validates versioned read-only audit JSON produced by Mission 1202. Enforces bounded size, exact schema, safe timestamps, lowercase SHA-256 and fail-closed safety flags. Validated records are only diagnostic, not evidence of actual human approval or permission to execute gameplay.

Experimental activation remains disabled. No production saves are read or written.
