# Mission 741: Experimental goal probabilities

This isolated research module consumes Mission 740 expected-goals values. It estimates **regulation-time** home-win, tie and away-win probabilities using independent Poisson goal distributions, truncating at 40 goals and normalizing the tiny omitted tail. It is a fictional, uncalibrated model, **not** an NHL prediction and **not** a game simulation. No actual goals are sampled or written.

If Mission 740 lacks complete evidence, all probabilities are null. The output retains blockers, missing slots, expected goals and false safety flags: eligibilityCertified, simulationAuthorized, scoreCalculated, gameResultCreated, sourceStateMutated, persistencePerformed.

Run `node hlm-phase10-experimental-goal-probabilities.test.js`.

No Front Office, Phase 10 demo, Phase 11 import, browser saves, gameplay, score records or persistence changes.
