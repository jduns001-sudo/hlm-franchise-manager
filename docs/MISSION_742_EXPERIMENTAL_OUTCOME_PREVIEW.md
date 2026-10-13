# Mission 742: Experimental regulation outcome preview

Builds on the **existing main-branch Mission 741** 0–6 goal Poisson distribution rather than replacing it. This avoids the conflicting alternative implementation in PR #769.

The preview calculates home win, tie and away win probability by summing independent home/away goal mass over 0..6 each. It then normalizes by included mass, meaning the estimates are **conditional on both teams scoring no more than six goals**, not unconditional regulation probabilities. This distinction is explicit in `conditioning` and `includedMass`. Incomplete roster evidence yields null probabilities.

Research-only: no score sampling, eligibility certification, game results, standings, simulation authorization, UI wiring or save changes. Safety flags remain false.

Run `node hlm-phase10-experimental-regulation-outcome-preview.test.js`.
