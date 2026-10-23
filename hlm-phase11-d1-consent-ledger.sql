-- Mission 1458: isolated D1 durable consent ledger. No production migration or settlement.
CREATE TABLE IF NOT EXISTS consent_state_revisions (
  team_id TEXT PRIMARY KEY NOT NULL,
  state_revision TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS consumed_cpu_decisions (
  decision_id TEXT PRIMARY KEY NOT NULL,
  proposal_digest TEXT NOT NULL,
  team_id TEXT NOT NULL,
  state_revision TEXT NOT NULL,
  consumed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS consumed_cpu_decisions_team ON consumed_cpu_decisions(team_id);
