"""Default-unmounted, read-only SQLite resolver for experimental Block L.

This adapter requires a dedicated host-created authoritative binding table.
It never infers ownership from browser state and never writes game state.
"""
import json
import sqlite3

SCHEMA = """CREATE TABLE IF NOT EXISTS block_l_authoritative_reviews (
 franchise TEXT PRIMARY KEY, owner_gm TEXT NOT NULL,
 browser_save_id TEXT NOT NULL, controlled_team_id TEXT NOT NULL,
 game_id TEXT NOT NULL, browser_baseline TEXT NOT NULL,
 player_ids_json TEXT NOT NULL, plan_id TEXT NOT NULL,
 decision_id TEXT NOT NULL, revision INTEGER NOT NULL,
 seed INTEGER NOT NULL
)"""

def resolve_authoritative_review(connection, gm, franchise):
    if not isinstance(connection, sqlite3.Connection):
        raise TypeError("Trusted SQLite connection required")
    if not isinstance(gm, str) or not gm or not isinstance(franchise, str) or not franchise:
        return None
    try:
        row = connection.execute(
            """SELECT owner_gm,browser_save_id,controlled_team_id,game_id,
               browser_baseline,player_ids_json,plan_id,decision_id,revision,seed
               FROM block_l_authoritative_reviews WHERE franchise=? AND owner_gm=?""",
            (franchise, gm)).fetchone()
    except sqlite3.OperationalError:
        return None
    if row is None:
        return None
    owner, save, team, game, baseline, players_json, plan, decision, revision, seed = row
    try:
        players = json.loads(players_json)
    except (ValueError, TypeError):
        return None
    if not isinstance(players, list) or not players or any(not isinstance(p, str) or not p for p in players):
        return None
    return dict(owner_gm=owner,franchise=franchise,browserSaveId=save,
        controlledTeamId=team,gameId=game,browserBaseline=baseline,
        playerIds=players,plan_id=plan,decision_id=decision,
        revision=revision,seed=seed)
