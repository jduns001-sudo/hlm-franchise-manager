# Phase 1 Exit Gate — Architecture & Data Foundation

## Decision
Phase 1 is eligible to close once this exit-gate record is reviewed and merged.

The project has established enough explicit identity, authority, provenance, and validation boundaries to begin Phase 2: Central Game State & Save System.

This does **not** claim that the data is clean or that all legacy records have been migrated. It means the remaining uncertainty is named and can be handled deliberately by Phase 2 rather than hidden inside UI code.

## Foundation established

### Player
- Universe Player ID is the canonical permanent Player identity.
- Roster rows remain source snapshots rather than independent Players.
- Duplicate/conflicting roster snapshots are preserved as diagnostics.
- Field authority is explicit.
- A read-only canonical Player snapshot composes registry + authority resolution.
- Runtime overrides cannot replace permanent Player identity.

### Team / organization references
- Known Team records come from the existing Team table.
- Unknown positive team-like IDs remain unresolved references.
- zero/negative values remain sentinels until their semantics are proven.
- Unknown references are not silently turned into Teams or Free Agents.
- A future Organization model remains required.

### Contract and Transaction
- Permanent namespaces are defined for new records.
- Legacy missing/invalid/duplicate IDs are detectable.
- Legacy records are not silently rewritten.
- Actual migration belongs to Phase 2 save-schema work.

### DraftPick
- Original owner and current owner are distinct.
- Existing occurrence-based prototype IDs are not treated as permanent identity.
- Natural-key collisions are detectable.
- Permanent DraftPick ID assignment and source-authority migration remain Phase 2 work.

### Validation
- Read-only validators report problems instead of repairing source data.
- Phase 1 readiness can be inspected through one aggregate entry point.
- Hard canonical identity blockers are separated from deferred migrations.

## Known debt carried into Phase 2
These items are intentional inputs to Phase 2, not forgotten work:

1. Define the central GameState schema and ownership boundary.
2. Define save metadata, schema versioning, serialization, validation, backup, and recovery.
3. Create migration strategy for existing browser state.
4. Assign/persist permanent Contract IDs during migration/creation.
5. Assign/persist permanent Transaction IDs during migration/creation.
6. Choose DraftPick source authority and assign persistent DraftPick IDs without relying on occurrence order.
7. Preserve unresolved Team/Organization references without inventing semantics.
8. Preserve current Front Office user data during migration.
9. Add command/event boundaries so gameplay mutations stop being ad-hoc UI writes.
10. Establish automated execution of foundation tests before runtime integration grows.

## Phase 2 entry rule
Do not replace the live Front Office state in one large rewrite.

Phase 2 should proceed incrementally:
1. define a standalone GameState envelope,
2. define versioned save serialization and validation,
3. prove round-trip save/load with synthetic state,
4. design legacy migration,
5. migrate one bounded data family at a time,
6. integrate with the Front Office only after the standalone path is proven.

## Systems that still must wait
Calendar/season advancement, player development, game simulation, CPU organizations, AI assistant, staff/morale, finances, media/history simulation, feeder leagues, and major UI redesign remain out of scope until the Phase 2 state/save foundation is stable.

## Phase 1 closure statement
Phase 1 did not attempt to build the game vertically. It established the data contracts that the rest of the game will depend on.

After merge of this exit gate, the next development mission is:

**Phase 2 Mission 1 — Central GameState Envelope**

That mission should be standalone and non-destructive. It must not yet replace the live browser database.
