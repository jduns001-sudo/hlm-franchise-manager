"""Durable regular-season review records must not mint playoff game authority."""
import importlib.util
import sqlite3
import unittest
from pathlib import Path
path=Path(__file__).with_name("hlm-phase11-block-m-trusted-playoff-decision-authority.py")
spec=importlib.util.spec_from_file_location("authority",path)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class AuthorityTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(":memory:",isolation_level=None)
  self.authority=module.TrustedPlayoffDecisionAuthority(self.db,enabled=True)
  self.args=("GM","F","R1","D1","P1",2)
 def tearDown(self):self.db.close()
 def test_missing_tables_denied(self):
  self.assertFalse(self.authority.verify(*self.args)["committed"])
 def test_actual_day_review_and_decision_still_not_playoff_proof(self):
  self.db.execute("CREATE TABLE block_i_lab_reviews (review_id TEXT,franchise_id TEXT,revision INTEGER,consumed INTEGER,decision_id TEXT,gm_proof_hash TEXT)")
  self.db.execute("CREATE TABLE block_e_lab_consumed_days (decision_id TEXT,franchise_id TEXT,previous_revision INTEGER,next_revision INTEGER)")
  self.db.execute("INSERT INTO block_i_lab_reviews VALUES ('R1','F',1,1,'D1','HASH')")
  self.db.execute("INSERT INTO block_e_lab_consumed_days VALUES ('D1','F',1,2)")
  self.assertFalse(self.authority.verify(*self.args)["authenticated"])
  self.assertFalse(self.authority.verify(*self.args)["approvedByGM"])
 def test_default_off_denied(self):
  off=module.TrustedPlayoffDecisionAuthority(self.db)
  self.assertFalse(off.verify(*self.args)["committed"])
if __name__=="__main__":unittest.main()
