"""TEST ONLY: guarded synthetic season day on the existing isolated SQLite state."""
import copy
import hashlib
import secrets
import json
import sqlite3
import subprocess
from pathlib import Path


class GuardedSyntheticSeasonDay:
    def __init__(self, lab, source_backed=False, multi_game=False, review_required=False):
        self._lab = lab
        self._db = lab._db
        self._source_backed = source_backed
        self._multi_game = multi_game
        self._review_required = review_required
        if self._review_required:
            self._db.execute("""CREATE TABLE IF NOT EXISTS block_i_lab_reviews (
                review_id TEXT PRIMARY KEY NOT NULL,
                franchise_id TEXT NOT NULL,
                revision INTEGER NOT NULL,
                plan_hash TEXT NOT NULL,
                consumed INTEGER NOT NULL DEFAULT 0,
                decision_id TEXT UNIQUE,
                gm_proof_hash TEXT
            )""")
        self._db.execute("""CREATE TABLE IF NOT EXISTS block_e_lab_consumed_days (
            decision_id TEXT PRIMARY KEY NOT NULL,
            franchise_id TEXT NOT NULL REFERENCES block_a_lab_franchises(franchise_id),
            previous_revision INTEGER NOT NULL,
            next_revision INTEGER NOT NULL,
            CHECK(next_revision = previous_revision + 1)
        )""")

    def _plan(self, gm, franchise, revision, seed, state):
        if type(seed) is not int or seed < 0 or seed > 9007199254740991:
            raise ValueError("invalid-deterministic-seed")
        pending = [g for g in state["season"]["games"] if g["status"] == "scheduled"]
        if not pending:
            raise ValueError("no-scheduled-game")
        from datetime import date
        dates = []
        for g in pending:
            raw = g.get("date")
            if not isinstance(raw, str) or date.fromisoformat(raw).isoformat() != raw:
                raise ValueError("invalid-scheduled-date")
            dates.append(raw)
        selected = min(dates)
        games = sorted(({"id": g["id"], "home": g["home"], "away": g["away"], "date": g["date"]}
                        for g in pending if g["date"] == selected), key=lambda g: g["id"])
        return {"gm": gm["gm"], "franchise": franchise, "revision": revision,
                "games": games, "seed": seed}

    def prepare_review(self, *, gm, franchise, revision, seed):
        if not (self._review_required and self._source_backed and self._multi_game):
            raise ValueError("review-mode-required")
        session = self._lab._gm_sessions.get(gm.get("token")) if isinstance(gm, dict) else None
        if not session or session != (franchise, gm.get("gm"), gm.get("proof")):
            raise ValueError("gm-untrusted")
        row = self._db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
                               (franchise,)).fetchone()
        if not row or row[0] != revision:
            raise ValueError("stale-revision")
        plan = self._plan(gm, franchise, revision, seed, json.loads(row[1]))
        digest = hashlib.sha256(json.dumps(plan, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        review_id = secrets.token_hex(24)
        proof_hash = hashlib.sha256((gm["token"] + ":" + gm["proof"]).encode()).hexdigest()
        self._db.execute(
            "INSERT INTO block_i_lab_reviews (review_id,franchise_id,revision,plan_hash,consumed,gm_proof_hash) VALUES (?,?,?,?,0,?)",
            (review_id, franchise, revision, digest, proof_hash))
        return {"review_id": review_id, "plan": plan}

    def recover_review(self, *, gm, franchise, review_id):
        """Read-only recovery: never grants approval or mutates franchise state."""
        session = self._lab._gm_sessions.get(gm.get("token")) if isinstance(gm, dict) else None
        if not session or session != (franchise, gm.get("gm"), gm.get("proof")):
            raise ValueError("gm-untrusted")
        row = self._db.execute(
            "SELECT revision,plan_hash,consumed,decision_id,gm_proof_hash FROM block_i_lab_reviews "
            "WHERE review_id=? AND franchise_id=?", (review_id, franchise)).fetchone()
        proof_hash = hashlib.sha256((gm["token"] + ":" + gm["proof"]).encode()).hexdigest()
        if not row or row[4] != proof_hash:
            raise ValueError("review-unavailable")
        current = self._db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",
                                   (franchise,)).fetchone()
        return {"review_id": review_id, "revision": row[0],
                "status": "consumed" if row[2] else ("stale" if not current or current[0] != row[0] else "pending"),
                "decision_id": row[3]}

    def advance(self, *, gm, franchise, revision, decision_id, approved=False,
                enabled=False, cancelled=False, declined=False, fail_at=None, seed=0, review_id=None, **_untrusted):
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
            if self._review_required:
                if not (self._multi_game and self._source_backed and isinstance(review_id, str)):
                    raise ValueError("review-required")
                review = self._db.execute(
                    "SELECT franchise_id,revision,plan_hash,consumed,decision_id,gm_proof_hash FROM block_i_lab_reviews WHERE review_id=?",
                    (review_id,)).fetchone()
                if not review or review[0] != franchise or review[1] != revision or review[3]:
                    raise ValueError("review-invalid-or-consumed")
                plan = self._plan(gm, franchise, revision, seed, state)
                digest = hashlib.sha256(json.dumps(plan, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
                if review[2] != digest:
                    raise ValueError("review-plan-mismatch")
                proof_hash = hashlib.sha256((gm["token"] + ":" + gm["proof"]).encode()).hexdigest()
                if review[5] != proof_hash:
                    raise ValueError("review-session-mismatch")
                if review[4] is not None and review[4] != decision_id:
                    raise ValueError("review-decision-mismatch")
            season = state["season"]
            if not isinstance(season["day"], int) or season["day"] < 0:
                raise ValueError("invalid-season-day")
            pending = [g for g in season["games"] if g["status"] == "scheduled"]
            if not pending:
                raise ValueError("no-scheduled-game")
            game = pending[0]
            if self._multi_game:
                if not self._source_backed:
                    raise ValueError("source-backed-required")
                if type(seed) is not int or seed < 0 or seed > 9007199254740991:
                    raise ValueError("invalid-deterministic-seed")
                # Earliest valid scheduled day, independent of fixture array order.
                from datetime import date
                dates = []
                for scheduled in pending:
                    raw_date = scheduled.get("date")
                    if not isinstance(raw_date, str):
                        raise ValueError("missing-scheduled-date")
                    parsed = date.fromisoformat(raw_date)
                    if parsed.isoformat() != raw_date:
                        raise ValueError("invalid-scheduled-date")
                    dates.append(raw_date)
                selected_date = min(dates)
                day_games = [g for g in pending if g["date"] == selected_date]
                if len(day_games) < 1:
                    raise ValueError("no-scheduled-day")
                teams = state["universe"]["teams"]
                # Existing historical finals must be valid for a full standings projection.
                prior_finals = []
                for g in season["games"]:
                    if g.get("status") == "final":
                        prior_finals.append({
                            "id": g["id"], "status": "final",
                            "homeTeamId": g.get("homeTeamId", g.get("home")),
                            "awayTeamId": g.get("awayTeamId", g.get("away")),
                            "homeGoals": g["homeGoals"], "awayGoals": g["awayGoals"],
                            "overtime": g.get("overtime", False)
                        })
                input_data = {"games": day_games, "teams": teams,
                              "priorFinals": prior_finals, "seed": seed}
                output = subprocess.run(
                    ["node", str(Path(__file__).with_name("hlm-phase11-block-g-multigame-adapter.js"))],
                    input=json.dumps(input_data), capture_output=True, text=True,
                    timeout=10, check=True
                )
                projection = json.loads(output.stdout)
                results = projection["results"]
                if len(results) != len(day_games):
                    raise ValueError("incomplete-day-results")
                for target, score in zip(day_games, results):
                    if (score.get("gameId") != target["id"] or
                        score.get("homeTeamId") != target["home"] or
                        score.get("awayTeamId") != target["away"] or
                        score.get("status") != "final"):
                        raise ValueError("invalid-day-result")
                    target.update(score)
                season["standings"] = projection["standings"]
            elif self._source_backed:
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
            if self._review_required:
                changed = self._db.execute(
                    "UPDATE block_i_lab_reviews SET consumed=1,decision_id=? WHERE review_id=? AND consumed=0",
                    (decision_id, review_id)).rowcount
                if changed != 1:
                    raise ValueError("review-replay")
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
