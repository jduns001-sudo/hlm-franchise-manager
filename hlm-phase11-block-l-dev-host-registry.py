"""Isolated Block L development-only host registry. No HTTP, browser or production auth."""
import sqlite3

SCHEMA = """CREATE TABLE IF NOT EXISTS block_l_dev_host_franchises (
 franchise TEXT PRIMARY KEY,
 owner_gm TEXT NOT NULL,
 browser_save_id TEXT NOT NULL,
 controlled_team_id TEXT NOT NULL,
 source_digest TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision >= 0)
)"""

class DevelopmentHostRegistry:
    def __init__(self, connection, *, enabled=False):
        if enabled is not True:
            raise RuntimeError("Development host registry disabled")
        if not isinstance(connection, sqlite3.Connection):
            raise TypeError("Dedicated SQLite connection required")
        self._db = connection
        self._db.execute(SCHEMA)

    def provision(self, *, franchise, owner_gm, save_id, team_id, source_digest):
        fields=(franchise,owner_gm,save_id,team_id,source_digest)
        if any(not isinstance(v,str) or not v.strip() for v in fields):
            raise ValueError("Complete server-owned identity required")
        # Provisioning is a host-only fixture operation; never expose via HTTP.
        with self._db:
            self._db.execute("INSERT INTO block_l_dev_host_franchises VALUES (?,?,?,?,?,0)",fields)

    def rotate(self, *, franchise, expected_revision, source_digest):
        if type(expected_revision) is not int or expected_revision < 0 or not isinstance(source_digest,str) or not source_digest.strip():
            raise ValueError("Invalid host revision")
        with self._db:
            result=self._db.execute(
                "UPDATE block_l_dev_host_franchises SET source_digest=?,revision=revision+1 WHERE franchise=? AND revision=?",
                (source_digest,franchise,expected_revision))
            if result.rowcount != 1:
                raise PermissionError("Stale host registry revision")

    def resolve(self, *, session, franchise):
        # Session comes from an independently authenticated development host.
        if not isinstance(session,dict) or not isinstance(session.get("gm"),str) or not session["gm"] or not isinstance(session.get("session_id"),str) or not session["session_id"]:
            raise PermissionError("Authenticated development host session required")
        row=self._db.execute(
            "SELECT owner_gm,browser_save_id,controlled_team_id,source_digest FROM block_l_dev_host_franchises WHERE franchise=? AND owner_gm=?",
            (franchise,session["gm"])).fetchone()
        if row is None:
            raise PermissionError("No server-owned franchise")
        return dict(owner_gm=row[0],franchise=franchise,browserSaveId=row[1],controlledTeamId=row[2],sourceDigest=row[3])

    def enrollment_source(self, *, session):
        # Closure captures the authenticated session; caller cannot replace GM.
        def lookup(principal, franchise):
            if principal != session.get("gm"):
                raise PermissionError("GM mismatch")
            return self.resolve(session=session,franchise=franchise)
        return lookup
