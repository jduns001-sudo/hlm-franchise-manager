# Mission 734: League participation references

Read-only assessment of explicitly provided league and team IDs against GameState universe leagues and canonical team records. Membership uses an explicit `teamIds` array on exactly one league record. It does not infer league membership from roster players, team names, abbreviations, or historical organizations.

A consistent unique list can establish only reference consistency, **not** league eligibility certification or game authorization. Missing/duplicate league records, malformed/unknown/duplicate membership IDs, unknown participating teams, and known teams absent from a valid list yield explicit blockers. Source state, scores, standings, Front Office, Phase 10 demo and browser saves remain untouched.

`assessLeagueParticipationReferences(state, leagueId, homeTeamId, awayTeamId)` returns per-team membership states, blocker codes, validation and fixed false safety flags. A future mission may connect this evidence to broader game-readiness decisions after league rules and season membership authority are defined.

Run `node hlm-phase10-league-participation-references.test.js`.
