"""Default-off authenticated host boundary for isolated championship reviews.

The host must independently authenticate sessions and supply a trusted resolver.
Browser-provided identities or championship claims are never authority.
"""
class AuthenticatedChampionshipBridge:
    def __init__(self, ledger, *, session_verifier, authority_resolver, enabled=False):
        if not callable(session_verifier) or not callable(authority_resolver):
            raise TypeError("Trusted session verifier and authoritative resolver required")
        self._ledger=ledger
        self._verify=session_verifier
        self._resolve=authority_resolver
        self._enabled=enabled is True

    def _authority(self, *, session, franchise, revision=None):
        if not self._enabled:raise PermissionError("championship bridge disabled")
        identity=self._verify(session)
        if not isinstance(identity,dict) or not isinstance(identity.get("gm"),str) or not identity["gm"] or not identity.get("session_id"):
            raise PermissionError("Authenticated GM session required")
        authority=self._resolve(identity["gm"],franchise)
        if not isinstance(authority,dict) or authority.get("owner_gm")!=identity["gm"] or authority.get("franchise")!=franchise:
            raise PermissionError("Franchise ownership not verified")
        if revision is not None and authority.get("revision")!=revision:
            raise PermissionError("Stale authoritative revision")
        return identity["gm"]

    def prepare(self, *, session, franchise, revision, decision_id, review_id):
        gm=self._authority(session=session,franchise=franchise,revision=revision)
        return self._ledger.prepare(franchise=franchise,gm=gm,revision=revision,
                                    decision_id=decision_id,review_id=review_id)

    def settle(self, *, session, franchise, revision, decision_id, review_id, approved=False, fail_at=None):
        gm=self._authority(session=session,franchise=franchise,revision=revision)
        return self._ledger.settle(franchise=franchise,gm=gm,revision=revision,
                                   decision_id=decision_id,review_id=review_id,
                                   approved=approved,fail_at=fail_at)

    def recover(self, *, session, franchise, review_id):
        gm=self._authority(session=session,franchise=franchise)
        return self._ledger.recover(franchise=franchise,gm=gm,review_id=review_id)
