# Mission 722: Read-only lineup construction proposals

Builds deterministic six-slot proposals from Mission 721 candidate assessments: one C, one LW, one RW, two D, one G. For each position, select the highest overall candidate; tie-break on lower permanent player ID. No player can occupy two slots. Bench players are unselected valid candidates; excluded players and unresolved organizations are not used.

This is an **illustrative starter unit**, not a complete NHL game lineup. It does not enforce full 18-skater/two-goalie roster rules, injuries, contracts, special teams, chemistry or user decisions. Missing slots are explicitly reported. A complete proposal does **not** authorize simulation. All safety flags are false.

Tests cover highest rating selection, deterministic ID tie breaks, missing roles, bench/excluded players, sentinel preservation, unchanged state, detached outputs and invalid input.

Run `node hlm-phase10-lineup-proposals.test.js`. No Front Office, Phase 10 demo, browser saves, score simulation or gameplay changes.
