"""Development-only host registry security tests. No production/browser access."""
import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

registry=load("block_l_dev_registry","hlm-phase11-block-l-dev-host-registry.py")
enrollment=load("block_l_dev_enrollment","hlm-phase11-block-l-trusted-enrollment.py")
binding=load("block_l_dev_binding","hlm-phase11-block-l-authoritative-binding.py")

class DevelopmentHostRegistryTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:")
        self.db.execute(enrollment.SCHEMA)
        self.host=registry.DevelopmentHostRegistry(self.db,enabled=True)
        self.host.provision(franchise="F1",owner_gm="GM1",save_id="SAVE1",
                            team_id="TEAM1",source_digest="DIGEST1")
        self.session={"gm":"GM1","session_id":"SESSION-1"}
    def tearDown(self):
        self.db.close()
    def enroll(self,session=None,**changes):
        args=dict(principal="GM1",franchise="F1",save_id="SAVE1",team_id="TEAM1",
                  source_digest="DIGEST1",attested_by="trusted-host",
                  trusted_source_resolver=self.host.enrollment_source(session=session or self.session))
        return enrollment.enroll_trusted_franchise(self.db,**{**args,**changes})
    def test_default_off_and_no_browser_authority(self):
        with self.assertRaises(RuntimeError):
            registry.DevelopmentHostRegistry(self.db)
        for session in ({},{"gm":"GM2","session_id":"SESSION-2"},{"gm":"GM1"}, {"gm":"GM1","session_id":""}):
            with self.subTest(session=session),self.assertRaises(PermissionError):
                self.enroll(session=session, trusted_source_resolver=self.host.enrollment_source(session=session))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0],0)
    def test_owner_save_team_digest_and_idempotent(self):
        for key,value in (("principal","GM2"),("save_id","FORGED"),("team_id","FORGED"),("source_digest","FORGED")):
            with self.subTest(key=key),self.assertRaises(PermissionError):
                self.enroll(**{key:value})
        self.assertTrue(self.enroll())
        self.assertFalse(self.enroll())
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0],1)
    def test_stale_registry_revision_rejects_without_write(self):
        before=self.db.total_changes
        with self.assertRaises(PermissionError):
            self.host.rotate(franchise="F1",expected_revision=9,source_digest="DIGEST2")
        self.assertEqual(self.db.total_changes,before)
        self.host.rotate(franchise="F1",expected_revision=0,source_digest="DIGEST2")
        with self.assertRaises(PermissionError):
            self.enroll()
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0],0)
    def test_concurrent_enrollment_file_backed_conflict_and_no_write(self):
        with tempfile.TemporaryDirectory() as folder:
            path=str(Path(folder)/"concurrent.sqlite")
            first=sqlite3.connect(path,timeout=2)
            second=sqlite3.connect(path,timeout=2)
            try:
                first.execute(enrollment.SCHEMA)
                host=registry.DevelopmentHostRegistry(first,enabled=True)
                host.provision(franchise="F1",owner_gm="GM1",save_id="SAVE1",
                               team_id="TEAM1",source_digest="DIGEST1")
                resolver=host.enrollment_source(session=self.session)
                args=dict(principal="GM1",franchise="F1",save_id="SAVE1",
                          team_id="TEAM1",source_digest="DIGEST1",
                          attested_by="trusted-host",trusted_source_resolver=resolver)
                self.assertTrue(enrollment.enroll_trusted_franchise(first,**args))
                self.assertFalse(enrollment.enroll_trusted_franchise(second,**args))
                before=second.total_changes
                with self.assertRaises(PermissionError):
                    enrollment.enroll_trusted_franchise(second,**{**args,"save_id":"FORGED"})
                self.assertEqual(second.total_changes,before)
                self.assertEqual(second.execute(
                    "SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0],1)
            finally:
                second.close()
                first.close()

    def test_duplicate_provisioning_preserves_original_identity(self):
        original=self.host.resolve(session=self.session,franchise="F1")
        before=self.db.total_changes
        for owner,save in (("GM1","SAVE1"),("GM2","SAVE2")):
            with self.subTest(owner=owner),self.assertRaises(sqlite3.IntegrityError):
                self.host.provision(franchise="F1",owner_gm=owner,save_id=save,
                                    team_id="TEAM1",source_digest="DIGEST1")
        self.assertEqual(self.db.total_changes,before)
        self.assertEqual(self.host.resolve(session=self.session,franchise="F1"),original)
        with self.assertRaises(PermissionError):
            self.host.resolve(session={"gm":"GM2","session_id":"S2"},franchise="F1")

    def test_reopen_after_rejected_lifecycle_operations(self):
        with tempfile.TemporaryDirectory() as folder:
            path=str(Path(folder)/"lifecycle.sqlite")
            connection=sqlite3.connect(path)
            try:
                connection.execute(enrollment.SCHEMA)
                host=registry.DevelopmentHostRegistry(connection,enabled=True)
                host.provision(franchise="F1",owner_gm="GM1",save_id="SAVE1",
                               team_id="TEAM1",source_digest="DIGEST1")
                before=connection.total_changes
                with self.assertRaises(sqlite3.IntegrityError):
                    host.provision(franchise="F1",owner_gm="GM2",save_id="SAVE2",
                                   team_id="TEAM2",source_digest="FORGED")
                with self.assertRaises(PermissionError):
                    host.rotate(franchise="F1",expected_revision=99,source_digest="FORGED")
                self.assertEqual(connection.total_changes,before)
            finally:
                connection.close()
            reopened=sqlite3.connect(path)
            try:
                host=registry.DevelopmentHostRegistry(reopened,enabled=True)
                self.assertEqual(host.resolve(session=self.session,franchise="F1")["browserSaveId"],"SAVE1")
                self.assertEqual(reopened.execute(
                    "SELECT revision,source_digest FROM block_l_dev_host_franchises WHERE franchise='F1'"
                ).fetchone(),(0,"DIGEST1"))
            finally:
                reopened.close()

    def test_registry_revision_invalidates_signed_review_without_write(self):
        self.enroll()
        def authoritative(gm,franchise):
            try:
                x=self.host.resolve(session={"gm":gm,"session_id":"HOST"},franchise=franchise)
            except PermissionError:
                return None
            return dict(x,gameId="GAME1",browserBaseline=x["sourceDigest"],playerIds=["P1"],
                        plan_id="PLAN1",decision_id="DAY1",revision=1,seed=17)
        signer=binding.IsolatedReviewBinding(
            secret=b"dev-host-only-secret-key-at-least-32-bytes",
            authoritative_resolver=authoritative,clock=lambda:1000,ttl_seconds=60)
        signed=signer.issue(session=self.session,franchise="F1")
        self.assertEqual(signer.verify(session=self.session,envelope=signed)["revision"],1)
        self.host.rotate(franchise="F1",expected_revision=0,source_digest="DIGEST2")
        before=self.db.total_changes
        with self.assertRaises(PermissionError):
            signer.verify(session=self.session,envelope=signed)
        with self.assertRaises(PermissionError):
            signer.verify(session={"gm":"GM1","session_id":"ROTATED"},envelope=signed)
        self.assertEqual(self.db.total_changes,before)

    def test_file_reopen_and_session_bound_signed_review(self):
        self.enroll()
        with tempfile.TemporaryDirectory() as folder:
            path=str(Path(folder)/"host.sqlite")
            disk=sqlite3.connect(path)
            self.db.commit()
            self.db.backup(disk)
            disk.close()
            reopened=sqlite3.connect(path)
            try:
                host=registry.DevelopmentHostRegistry(reopened,enabled=True)
                self.assertEqual(host.resolve(session=self.session,franchise="F1")["browserSaveId"],"SAVE1")
                with self.assertRaises(PermissionError):
                    host.resolve(session={"gm":"GM2","session_id":"OTHER"},franchise="F1")
                def authoritative(gm,franchise):
                    try:
                        x=host.resolve(session={"gm":gm,"session_id":"SERVER-RESOLVED"},franchise=franchise)
                    except PermissionError:
                        return None
                    return dict(x,gameId="GAME1",browserBaseline="BASE1",playerIds=["P1"],
                                plan_id="PLAN1",decision_id="DAY1",revision=1,seed=17)
                clock=[1000]
                signer=binding.IsolatedReviewBinding(secret=b"dev-host-only-secret-key-at-least-32-bytes",
                     authoritative_resolver=authoritative,clock=lambda:clock[0],ttl_seconds=60)
                signed=signer.issue(session=self.session,franchise="F1")
                before=reopened.total_changes
                self.assertEqual(signer.verify(session=self.session,envelope=signed)["revision"],1)
                for rotated in ({"gm":"GM1","session_id":"SESSION-2"},{"gm":"GM2","session_id":"SESSION-1"}):
                    with self.assertRaises(PermissionError):
                        signer.verify(session=rotated,envelope=signed)
                clock[0]=1061
                with self.assertRaises(PermissionError):
                    signer.verify(session=self.session,envelope=signed)
                self.assertEqual(reopened.total_changes,before)
            finally:
                reopened.close()

if __name__=="__main__":
    unittest.main()
