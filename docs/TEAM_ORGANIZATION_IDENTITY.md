# HLM Phase 1 — Team & Organization Identity Dictionary

Mission 2 is an evidence-based identity audit. It documents current data; it does not migrate, repair, renumber, or change runtime behavior.

Confidence labels:
- **CONFIRMED** — directly established by repository structure or code.
- **INFERRED** — strongly suggested by current data/use, but not explicitly defined by an authoritative source.
- **AMBIGUOUS** — multiple meanings remain plausible.
- **UNKNOWN** — repository evidence is insufficient.

## 1. Identity principles
1. Team/organization identity is an immutable numeric ID, never a name or abbreviation.
2. Abbreviations are display data and are not unique.
3. A positive player `teamId` outside the current Team table is not automatically a Free Agent.
4. `-1`, `0`, and `100` are distinct sentinel values. They must not be collapsed or assigned stronger meanings than the evidence supports.
5. Current ownership and historical identity are separate concepts. DraftPick original team and current owner must remain separate.
6. Unknown identity is preserved as unknown. The application must not manufacture a team identity to make a reference resolve.

## 2. Existing Team namespace
**CONFIRMED:** the Universe Team table contains 277 records with 277 unique IDs. Mission 1 established that the table does not explicitly identify which records are top-level franchises.

**CONFIRMED:** the current data model reports repeated abbreviations, so abbreviation is not an identity key.

**AMBIGUOUS:** the Team table lacks authoritative fields for organization type, franchise level, active/historical status, predecessor/successor relationships, and league membership. ID range is therefore not a safe classification rule.

The application's use of low numeric IDs is a runtime heuristic, not proof that every low-ID record is a current top-level franchise.

## 3. Positive IDs outside the Team table
Mission 1 found 3,756 active Universe players assigned to positive IDs that are not present in the 277-row Team table.

The Mission 2 audit found **416 distinct positive outside-table IDs** for those players.

**UNKNOWN:** repository evidence does not reliably classify those 416 IDs as minor, junior, college, European, international, historical, or another category.

**Required rule:** preserve these assignments. Do not convert them to Free Agents and do not synthesize Team rows merely because the IDs are absent from the current Team table.

## 4. Sentinel values

### -1
Observed in Universe, roster, and historical/player-season contexts.

**INFERRED:** a no-team / Free-Agent-or-Other style marker.

It is not sufficient by itself to establish Free Agent eligibility. Runtime Free Agency uses additional assignment, roster, contract, waiver, retirement, and draft-age checks.

### 0
Observed in active and retired Universe players, roster rows, and player-season contexts.

**INFERRED:** an unassigned/no-team style marker.

Mission 1 found that most active Universe players using 0 are young players. That pattern does not establish a universal semantic definition and does not by itself establish Free Agent eligibility.

### 100
Observed heavily among retired Universe players and in roster/player-season data.

**AMBIGUOUS:** legacy, historical, or unknown marker. No authoritative repository source defines its exact meaning.

### Sentinel rule
**CONFIRMED:** all three values are absent from the current Team table and must remain distinct. None guarantees Free Agent eligibility.

## 5. Special/missing IDs
IDs **11, 31, 32, and 33** are absent from the current Team table and the Mission 2 audit found no current team/player/player-season/DraftPick evidence that establishes their identities.

**UNKNOWN:** whether those IDs represented historical organizations.

ID **27** is absent from the Team table but appears as owner on **80 Universe DraftPicks** spanning the source data.

**UNKNOWN:** repository evidence does not identify organization 27. Do not create a Team row or rewrite those owners based on guesswork.

The roster DraftPick source currently replaces the Universe DraftPick set at application startup when populated. The roster set contains no owner 27, but contains three picks with missing owner data. This does not resolve the meaning of 27.

## 6. Current vs historical organizations
**AMBIGUOUS:** the current data does not reliably distinguish current franchise, historical/defunct/relocated team, minor, junior, college, European, international, or other hockey organizations with authoritative type fields.

Names can suggest a category, but names are not identity metadata and must not be promoted to authoritative classification.

## 7. League membership
Archived/import material contains league information for some source records, but the current Team table does not provide an authoritative `leagueId` mapping for every Team.

**AMBIGUOUS:** a complete Team-to-League mapping cannot be established from the current canonical Team table alone.

## 8. DraftPick ownership implications
- `originalTeamId` is identity/history and must remain immutable.
- `currentOwnerId` is mutable ownership.
- An unresolved owner must remain unresolved and be reported diagnostically.
- ID 27 is unresolved; 80 Universe pick-owner references must not be silently remapped.
- Three roster picks have missing owner data and must not be silently assigned.
- Permanent DraftPick migration remains a later mission.

## 9. Player assignment and Free Agency implications
A player's current organization assignment is not equivalent to Free Agent eligibility.

A positive outside-table ID does not make a player a Free Agent. A sentinel value alone also does not guarantee eligibility. Current Free Agency derives eligibility from multiple runtime checks and must remain unchanged in Mission 2.

## 10. Future Organization model (documentation only)
A future model should separate durable organization identity from season/team participation and league identity. One possible shape:

```
Organization
  organizationId
  name
  abbreviation
  organizationType
  activeStatus
  parentOrganizationId
  historicalPredecessorId
  historicalSuccessorId

Team
  teamId
  organizationId
  seasonId
  leagueId
  displayIdentity

League
  leagueId
  name
  level
  region
```

This is conceptual only. No runtime Organization records are created in Mission 2.

## 11. Migration requirements
Before any identity migration:
1. Obtain authoritative mappings for the 416 positive outside-table IDs where possible.
2. Resolve or explicitly preserve unresolved ID 27.
3. Define exact sentinel semantics only when authoritative evidence exists.
4. Add explicit organization type, active/historical status, and league relationships.
5. Preserve all existing permanent Player and Team IDs.
6. Provide aliases/migration handling for persisted references before changing any identity representation.

## 12. Unresolved questions
- Exact source semantics of -1, 0, and 100.
- Identities/categories of the 416 positive outside-table IDs.
- Identity of missing Team ID 27.
- Whether 11/31/32/33 had historical meanings.
- Complete Team-to-League and organization-category mapping.
- Correct owners of the three roster picks with missing owner data.
- Current vs historical status for Team-table records where the source does not say.

Until those questions have authoritative answers, the correct behavior is to preserve the data and report ambiguity rather than repair it.
