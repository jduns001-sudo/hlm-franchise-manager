"""Experimental Block L: explicit GM command boundary over the existing SQLite coordinator.

This is a Python-side integration seam, NOT a GitHub Pages API or a production
save path. A browser transport must authenticate sessions before calling it.
"""
class GMReviewSimulationBridge:
    def __init__(self, coordinator):
        self.coordinator = coordinator

    def review(self, *, gm, franchise, revision, seed):
        return self.coordinator.prepare_review(
            gm=gm, franchise=franchise, revision=revision, seed=seed)

    def recover(self, *, gm, franchise, review_id):
        return self.coordinator.recover_review(
            gm=gm, franchise=franchise, review_id=review_id)

    def decide(self, *, gm, franchise, revision, seed, decision_id,
               review_id, action):
        if action not in ("approve", "decline"):
            raise ValueError("Explicit approve or decline action required")
        if action == "decline":
            # Do not consume the durable review or mutate any franchise state.
            return {"committed": False, "status": "declined"}
        if not review_id:
            raise ValueError("Review ID required")
        return self.coordinator.advance(
            gm=gm, franchise=franchise, revision=revision, seed=seed,
            decision_id=decision_id, review_id=review_id,
            approved=True, enabled=True)
