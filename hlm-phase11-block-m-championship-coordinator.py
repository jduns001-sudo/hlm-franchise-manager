"""Default-off isolated championship coordinator.

Trusted host injects session verification, franchise ownership, and authoritative
per-game settlement verification. Phase 10 replay runs in a fixed local Node module.
Neither client-supplied proof nor a bracket flag grants championship authority.
"""
import json
import subprocess
from pathlib import Path

class ChampionshipCoordinator:
    def __init__(self, settlement, *, session_verifier, franchise_resolver,
                 game_provenance_verifier, enabled=False):
        if not all(callable(x) for x in (session_verifier,franchise_resolver,game_provenance_verifier)):
            raise TypeError("Trusted host verification functions required")
        self.settlement=settlement
        self.verify_session=session_verifier
        self.resolve=franchise_resolver
        self.verify_game=game_provenance_verifier
        self.enabled=enabled is True

    def _gm(self, session, franchise, revision=None):
        if not self.enabled:raise PermissionError("championship coordinator disabled")
        identity=self.verify_session(session)
        if not isinstance(identity,dict) or not identity.get("gm") or not identity.get("session_id"):
            raise PermissionError("authenticated GM session required")
        authority=self.resolve(identity["gm"],franchise)
        if not isinstance(authority,dict) or authority.get("owner_gm")!=identity["gm"] or authority.get("franchise")!=franchise:
            raise PermissionError("franchise ownership required")
        if revision is not None and authority.get("revision")!=revision:
            raise PermissionError("stale franchise revision")
        return identity["gm"]

    def playoff_proof(self, state):
        bracket=state.get("extensions",{}).get("phase10Playoffs")
        if not isinstance(bracket,dict):return {"verified":False}
        script="""const {replayChampionshipBracket}=require('./hlm-phase11-block-m-strict-playoff-replay');
let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>{try{process.stdout.write(JSON.stringify(replayChampionshipBracket(JSON.parse(s))))}catch{process.exitCode=1}});"""
        run=subprocess.run(["node","-e",script],input=json.dumps(bracket),text=True,
                           capture_output=True,timeout=8,cwd=str(Path(__file__).resolve().parent),check=False)
        if run.returncode or not run.stdout:return {"verified":False}
        replay=json.loads(run.stdout)
        if replay.get("verified") is not True:return {"verified":False}
        games=[g for round_ in bracket["rounds"] for series in round_ for g in series["games"]]
        ids=[g.get("gameId") for g in games]
        if not ids or any(x is None for x in ids) or len(set(map(str,ids)))!=len(ids):
            return {"verified":False}
        for game in games:
            proof=self.verify_game(game["gameId"],state)
            if not isinstance(proof,dict) or proof.get("authenticated") is not True or proof.get("approvedByGM") is not True:
                return {"verified":False}
            if proof.get("game")!=game:return {"verified":False}
        return {"verified":True,"championTeamId":replay["championTeamId"]}

    def settle(self, *, session, franchise, revision, review_id, decision_id, approved=False, fail_at=None):
        gm=self._gm(session,franchise,revision)
        if self.settlement.validate is not self.playoff_proof:
            # Bound methods are distinct objects on each access; inspect ownership and function.
            callback=self.settlement.validate
            if getattr(callback,"__self__",None) is not self or getattr(callback,"__func__",None) is not ChampionshipCoordinator.playoff_proof:
                raise PermissionError("settlement validator is not coordinator-owned")
        return self.settlement.commit(franchise=franchise,gm=gm,revision=revision,
                                      review_id=review_id,decision_id=decision_id,
                                      approved=approved,fail_at=fail_at)

    def recover(self, *, session, franchise, review_id):
        gm=self._gm(session,franchise)
        return self.settlement.recover(franchise=franchise,gm=gm,review_id=review_id)
