# Mission 708: Independent priority summary contract

This mission adds a separate, literal-only synthetic contract suite for the Mission 707 read-only priority summary. It does not import Mission 703 fixtures, Mission 704 baseline, or Mission 705/706 report builders. Its only implementation import is the Mission 707 function under test.

The nine synthetic findings cover two critical, three high, two medium, and two low findings across five categories. The contract pins exact severity counts, category order (severity first, lexical ties), stable finding order within severity, original indices, group membership, highest-priority and urgent findings, metadata and safety flags. It also tests clean, high-only, medium-only, and low-only reports, malformed inputs, repeatability, and detached output arrays and collections.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-contract.test.js`.

This is advisory-only verification. No simulation, persistence, live franchise mutation, Front Office, Phase 10 demo, browser save, or gameplay change is included.
