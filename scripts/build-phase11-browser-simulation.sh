#!/usr/bin/env bash
set -euo pipefail
# Pinned bundler version. Build output is an isolated browser global with no save access.
npx --yes esbuild@0.25.12 hlm-phase11-browser-simulation-entry.js --bundle --platform=browser --format=iife --global-name=HLMPhase11SimBundle --target=es2020 --outfile=hlm-phase11-browser-simulation.bundle.js
