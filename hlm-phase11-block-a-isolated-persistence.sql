-- Phase 11 Block A isolated SQLite/D1 transactional persistence prototype.
-- NOT a production migration. NO authenticated CPU service or settlement endpoint.
-- This schema must only be installed in an isolated test database.
CREATE TABLE IF NOT EXISTS block_a_lab_franchises (
  franchise_id TEXT PRIMARY KEY NOT NULL,
  state_revision INTEGER NOT NULL CHECK (state_revision >= 0),
  game_state_json TEXT NOT NULL CHECK (json_valid(game_state_json)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS block_a_lab_consumed_decisions (
  decision_id TEXT PRIMARY KEY NOT NULL,
  franchise_id TEXT NOT NULL REFERENCES block_a_lab_franchises(franchise_id),
  proposal_digest TEXT NOT NULL,
  previous_revision INTEGER NOT NULL,
  next_revision INTEGER NOT NULL,
  consumed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (next_revision = previous_revision + 1)
);
CREATE TABLE IF NOT EXISTS block_a_lab_transaction_history (
  transaction_id TEXT PRIMARY KEY NOT NULL,
  franchise_id TEXT NOT NULL REFERENCES block_a_lab_franchises(franchise_id),
  decision_id TEXT NOT NULL UNIQUE REFERENCES block_a_lab_consumed_decisions(decision_id),
  previous_revision INTEGER NOT NULL,
  next_revision INTEGER NOT NULL,
  asset_delta_json TEXT NOT NULL CHECK (json_valid(asset_delta_json)),
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- A protected coordinator MUST execute these steps in ONE DB transaction:
-- 1. Authenticate GM session and independent CPU decision outside browser control.
-- 2. Read franchise revision and canonical state from this database.
-- 3. Recompute and validate every linked asset transfer against that state.
-- 4. UPDATE block_a_lab_franchises SET state_revision = :next,
--      game_state_json = :validated_new_state WHERE franchise_id = :id
--      AND state_revision = :expected; require exactly one affected row.
-- 5. INSERT consumed decision ID; UNIQUE constraint rejects replay.
-- 6. INSERT transaction history referencing the same decision ID.
-- 7. COMMIT all three writes or ROLLBACK all three.
-- D1 batch atomicity is insufficient without proof of all required affected-row checks.
-- Never execute a transaction from caller-provided SQL, state, signer or verifier.
