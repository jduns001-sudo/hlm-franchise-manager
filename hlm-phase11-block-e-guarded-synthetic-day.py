"""TEST ONLY: guarded synthetic season day on the existing isolated SQLite state."""
import copy
import json
import sqlite3
import subprocess
from pathlib import Path


class GuardedSyntheticSeasonDay:
    def __init__(self, lab, source_backed=False):
        self._lab = lab
        self._db = lab._db
        self._source_backed = source_backed
        self._db.execute("""CREATE TABLE IF NOT EXISTS block_e_lab_consumed_days (
            decision_id TEXT PRIMARY KEY NOT NULL,
            franchise_id TEXT NOT NULL REFERENCES block_a_lab_franchises(franchise_id),
            previous_revision INTEGER NOT NULL,
            next_revision INTEGER NOT NULL,
            CHECK(next_revision = previous_revision + 1)
        )""")

    def advance(self, *, gm, franchise, revision, decision_id, approved=False,
                enabled=False, cancelled=False, declined=False, fail_at=None, seed=0, **_untrusted):
        no_save = {"committed": False, "productionSaved": False}
        if not enabled or not approved or cancelled or declined:
            return dict(no_save, reason="approval-or-experiment-disabled")
        session = self._lab._gm_sessions.get(gm.get("token")) if isinstance(gm, dict) else None
        if not session or session != (franchise, gm.get("gm"), gm.get("proof")):
            return dict(no_save, reason="gm-untrusted")
        if not isinstance(decision_id, str) or not decision_id.startswith("SYNTHETIC-DAY-"):
            return dict(no_save, reason="invalid-day-decision")
        try:
            self._db.execute("BEGIN IMMEDIATE")
            row = self._db.execute(
                "SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
                (franchise,)
            ).fetchone()
            if not row or row[0] != revision:
                raise ValueError("stale-revision")
            state = json.loads(row[1])
            season = state["season"]
            if not isinstance(season["day"], int) or season["day"] < 0:
                raise ValueError("invalid-season-day")
            pending = [g for g in season["games"] if g["status"] == "scheduled"]
            if not pending:
                raise ValueError("no-scheduled-game")
            game = pending[0]
            if self._source_backed:
                if type(seed) is not int or seed < 0 or seed > 9007199254740991:
                    raise ValueError("invalid-deterministic-seed")
                input_data = {"gameId": game["id"], "homeTeamId": game["home"],
                              "awayTeamId": game["away"], "seed": seed}
                result = subprocess.run(
                    ["node", str(Path(__file__).with_name("hlm-phase11-block-f-score-adapter.js"))],
                    input=json.dumps(input_data), capture_output=True, text=True,
                    timeout=10, check=True
                )
                score = json.loads(result.stdout)
                if (score.get("gameId") != game["id"] or
                    score.get("homeTeamId") != game["home"] or
                    score.get("awayTeamId") != game["away"] or
                    score.get("status") != "final" or
                    type(score.get("homeGoals")) is not int or
                    type(score.get("awayGoals")) is not int or
                    score["homeGoals"] < 0 or score["awayGoals"] < 0 or
                    score["homeGoals"] == score["awayGoals"]):
                    raise ValueError("invalid-source-backed-result")
                game.update(score)
            else:
                game["status"] = "final"
                game["homeGoals"] = 2
                game["awayGoals"] = 1
            season["day"] += 1
            season.setdefault("completedDayDecisions", []).append(decision_id)
            updated = self._db.execute(
                "UPDATE block_a_lab_franchises SET state_revision=?,game_state_json=? "
                "WHERE franchise_id=? AND state_revision=?",
                (revision + 1, json.dumps(state), franchise, revision)
            ).rowcount
            if updated != 1:
                raise ValueError("cas-rejected")
            if fail_at == "state":
                raise RuntimeError("injected-state")
            self._db.execute(
                "INSERT INTO block_e_lab_consumed_days VALUES (?,?,?,?)",
                (decision_id, franchise, revision, revision + 1)
            )
            if fail_at == "decision":
                raise RuntimeError("injected-decision")
            self._db.execute("COMMIT")
            return {"committed": True, "productionSaved": False, "revision": revision + 1}
        except (ValueError, RuntimeError, sqlite3.IntegrityError, KeyError, TypeError, subprocess.SubprocessError) as exc:
            self._db.execute("ROLLBACK")
            return dict(no_save, reason=str(exc))
        except BaseException:
            self._db.execute("ROLLBACK")
            raise
