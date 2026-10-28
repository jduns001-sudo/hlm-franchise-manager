"""Default-off trusted enrollment prerequisite for Block L.

Only a trusted host may insert this mapping after independently authenticating
the GM and validating the loaded franchise against a server-side source.
Browser save metadata is never an ownership credential.
"""
import sqlite3

SCHEMA = """CREATE TABLE IF NOT EXISTS block_l_trusted_enrollments (
 franchise TEXT PRIMARY KEY,
 owner_gm TEXT NOT NULL,
 browser_save_id TEXT NOT NULL,
 controlled_team_id TEXT NOT NULL,
 source_digest TEXT NOT NULL,
 created_by TEXT NOT NULL
)"""

def enroll_trusted_franchise(connection, *, principal, franchise, save_id,
                            team_id, source_digest, attested_by):
    if not isinstance(connection, sqlite3.Connection):
        raise TypeError("Trusted SQLite connection required")
    fields = (principal, franchise, save_id, team_id, source_digest, attested_by)
    if any(not isinstance(v, str) or not v.strip() for v in fields):
        raise ValueError("Complete trusted enrollment required")
    if attested_by != "trusted-host":
        raise PermissionError("Host attestation required")
    # An existing identity must never be reassigned by an enrollment replay.
    connection.execute(SCHEMA)
    with connection:
        existing = connection.execute(
            "SELECT owner_gm,browser_save_id,controlled_team_id,source_digest "
            "FROM block_l_trusted_enrollments WHERE franchise=?", (franchise,)
        ).fetchone()
        expected = (principal, save_id, team_id, source_digest)
        if existing is not None:
            if existing != expected:
                raise PermissionError("Conflicting enrollment")
            return False
        connection.execute(
            "INSERT INTO block_l_trusted_enrollments VALUES (?,?,?,?,?,?)",
            (franchise, principal, save_id, team_id, source_digest, attested_by))
        return True

def resolve_trusted_enrollment(connection, *, principal, franchise):
    if not isinstance(connection, sqlite3.Connection):
        raise TypeError("Trusted SQLite connection required")
    row = connection.execute(
        "SELECT browser_save_id,controlled_team_id,source_digest "
        "FROM block_l_trusted_enrollments WHERE franchise=? AND owner_gm=?",
        (franchise, principal)).fetchone()
    if row is None:
        return None
    return dict(franchise=franchise, owner_gm=principal,
                browserSaveId=row[0], controlledTeamId=row[1], sourceDigest=row[2])
