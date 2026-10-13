# Mission 732: Roster game preview eligibility review

Pure, conservative review of Mission 731's illustrative roster-backed regulation/overtime preview. Returns a detached calculated score (when a preview exists), missing starter slots, and explicit blockers. An illustrative preview is **never** a legal lineup or an official game.

Blockers: incomplete starter proposals, franchise identity diagnostics, unverified league eligibility, unverified player contract/injury status, unimplemented lineup authorization and unimplemented official-result commit. Even a complete clean preview retains four blockers and all authorization, official-result, mutation and persistence flags false.

This mission does not simulate, record or apply a game, modify standings, save data, or alter Front Office/Phase 10 demo. Future work must independently resolve eligibility before any official gameplay integration.

Run `node hlm-phase10-roster-game-preview-eligibility.test.js`.
