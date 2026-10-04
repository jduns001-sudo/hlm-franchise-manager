# Phase 2 Mission 2: GameState Serialization

This mission defines deterministic, versioned JSON serialization for standalone GameState.

Valid state is structurally checked before serialization. Loaded JSON is parsed, schema-version checked, and structurally validated before acceptance. Object keys are ordered deterministically while array order is preserved.

The round-trip helper serializes, reloads, and serializes again so equivalent state can be compared exactly.

This is serialization, not persistence. It does not write files, use browser storage, create save slots, migrate prototype data, mutate gameplay, or connect to the Front Office.

The next controlled step is a save-file envelope with metadata and an integrity boundary around serialized GameState. Legacy browser migration remains later work.

Mission 2 exits when valid state round-trips deterministically, malformed or unsupported saves fail explicitly, source state is not mutated, and the live application remains disconnected.
