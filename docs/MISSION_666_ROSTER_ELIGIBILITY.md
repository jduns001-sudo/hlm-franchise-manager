# Mission 666: Read-only simulation roster eligibility assessment

## Contract
`assessSimulationRosterEligibility(classifiedCanonicalBridgeSnapshot)` consumes the Mission 665 classified bridge output. It returns a detached report with per-player assessments, team-associated player IDs, candidate/excluded lists and counts. No writes or automatic lineup decisions.

Assessments:
- `candidate`: nonretired canonical player with a confirmed exact-ID team association. This is **only a candidate for later evaluation**, not an eligible or active-roster player.
- `excluded`: retired player, even when assigned to a known team.
- `undetermined`: nonretired player without a confirmed known team association, including distinct -1, 0, 100 and unresolved external organization references.

All players have `gameEligible: null` and `lineupEligible: null`. The system cannot yet determine contracts, injuries, waivers, age restrictions, league participation, game-day roster rules, or assignment eligibility. Neither `candidate` nor `undetermined` grants permission to play. The existing canonical bridge's validation rules are unchanged.

## Scope boundaries
No browser storage, Front Office, Phase 10 demo, source JSON, game simulation, free agency, roster movement, or lineup creation is modified. The report is not yet connected to the live simulation. Historical roster duplicates do not become new players. Player IDs and team IDs are preserved.

## Verification
`node hlm-simulation-roster-eligibility.test.js` covers team association, retirement, sentinels, unresolved organizations, explicit override precedence, nonmutation and invalid inputs.
