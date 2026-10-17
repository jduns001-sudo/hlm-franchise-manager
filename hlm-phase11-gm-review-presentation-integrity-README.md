# Mission 1182: experimental GM review presentation integrity

Adds a deterministic SHA-256 digest for validated, bounded, read-only computed GM review HTML. The digest can identify content changes between reviews, but is not an authentication signature. Invalid evidence returns no HTML or digest.

This experimental adapter does not touch production saves, activate gameplay, or authorize GM decisions.
