# HLM27 Franchise Manager - Copilot Instructions

## Project

This repository is an existing Hockey Legacy Manager 27 (HLM27) Franchise Manager Progressive Web App (PWA).

Repository:
jduns001-sudo/hlm-franchise-manager

Live application:
https://jduns001-sudo.github.io/hlm-franchise-manager/

The application is a mobile-friendly hockey franchise-management system using HTML, CSS, JavaScript, JSON, browser storage, and GitHub Pages.

DO NOT rebuild the application from scratch.

Preserve existing functionality unless the user specifically asks for it to be changed or removed.

## Existing Features

The application already contains:

- Franchise Command Center
- Controlled Team selection
- My Roster
- Team Rosters
- Lines
- Depth Chart
- Prospects
- Draft tools
- Contracts
- Transactions
- History
- Notes
- Franchise settings
- Player data
- Team data
- Season data
- Draft-pick data
- PWA functionality
- GitHub Pages deployment

Understand the existing systems before modifying them.

## Important Git History

Known-good app.html version:

cf8c5d

Known-broken versions:

b1d29b6
f88fa3b

The known-good version must be preserved as a recovery point.

If the application develops a major regression, compare the current code against cf8c5d before attempting complicated repairs.

Never delete the known-good recovery point.

## Player Data

The authoritative roster file is:

hlm-roster-2026.json

The universe file is:

hlm-universe.json

The roster contains player information including:

- id
- name
- team
- teamId
- position
- age
- ovr
- potential
- type
- birthYear
- nation
- hand
- height
- season information
- ratings

Do not confuse jersey number with Overall rating.

A known example is Evgeni Malkin:

Player ID: 1003094
Jersey number: 71
Correct Overall: 86
Potential: 88

The player's ovr field must represent Overall, not jersey number.

## Main Application

app.html is currently the main application file.

It contains substantial JavaScript and application logic.

Before modifying app.html:

1. Locate the exact function or section that needs to change.
2. Understand how it interacts with the rest of the application.
3. Make the smallest safe change possible.
4. Check for syntax errors.
5. Test the affected feature.
6. Test application initialization and navigation.

Do not blindly edit large minified JavaScript sections.

## Initialization and Data Safety

The application's initialization and browser database/state logic are critical.

Be especially careful with:

- initDB()
- openStateDB()
- state migration
- local storage
- franchise settings
- player loading
- team loading
- roster loading

Do not modify initialization code unless the requested change actually requires it.

A previous attempted Overall-rating fix modified initDB() and caused a major regression that broke:

- navigation
- Controlled Team selection
- roster screens
- Front Office initialization

Treat initialization changes as high risk.

## Development Rules

1. Never rebuild the application unnecessarily.
2. Make one major change at a time.
3. Preserve existing working features.
4. Preserve player IDs.
5. Preserve team IDs.
6. Preserve existing JSON structures unless a change is necessary.
7. Preserve franchise state and browser data.
8. Avoid unnecessary dependencies.
9. Prefer small, clearly named commits.
10. Make changes easy to undo.

Do not combine unrelated fixes into one change.

## Testing

After making a change, test the affected functionality.

At minimum verify:

- Application loads
- Navigation appears
- Controlled Team can be selected
- My Roster loads
- Team Rosters loads
- Lines loads
- Depth Chart loads

For player data changes verify:

- Player name
- Position
- Overall
- Potential
- Jersey number

A successful code edit does not mean the application is working. Test the actual behavior.

## Git Safety

For substantial changes, use a separate branch.

Do not intentionally overwrite main with experimental code.

Before merging a change:

1. Review the diff.
2. Confirm only intended files changed.
3. Confirm existing functionality was not accidentally removed.
4. Test the application.
5. Merge only after verification.

If a change is risky, explain the risk before proceeding.

## User

The user is building this application primarily from an Android phone and is not a professional programmer.

Give clear, practical instructions.

Do not assume the user understands advanced programming, Git, databases, branches, pull requests, or build systems.

When user action is required, provide simple step-by-step instructions.

Avoid asking the user to manually edit enormous blocks of JavaScript when a safer repository-level change is possible.

## Future Development

The long-term goal is a complete HLM27 franchise-management application.

Future systems may include:

- Player development
- Scouting
- Drafting
- Draft classes
- Free agency
- Trades
- Contracts
- Salary cap
- Waivers
- Line management
- Depth charts
- Prospects
- Player progression
- Player regression
- Statistics
- Awards
- League history
- Franchise records
- Retirements
- Draft history
- Team history
- Custom players
- Custom teams
- Expansion teams
- Search and filtering
- Mobile interface improvements
- Notifications
- Data backup/import/export
- Improved PWA/offline behavior

Future features must integrate with the existing application rather than becoming separate unrelated applications.

## Priority

When working on this repository:

1. Protect existing functionality.
2. Preserve the known-good cf8c5d recovery point.
3. Keep the application loading correctly.
4. Keep navigation working.
5. Keep Controlled Team selection working.
6. Keep roster functionality working.
7. Keep Lines and Depth Chart working.
8. Make changes incrementally.
9. Test every significant change.
10. Continue expanding the application only after the foundation is stable.

## Most Important Rule

Before making a significant change, inspect the repository and understand the existing implementation.

Do not guess how the application works.

Do not assume a file, function, field, or database structure exists without checking.

When multiple solutions are possible, prefer the solution that:

- Changes the fewest existing systems
- Preserves existing data
- Preserves existing UI
- Is easiest to test
- Is easiest to undo
- Introduces the least unnecessary complexity

The objective is to steadily improve the existing HLM27 Franchise Manager without breaking the pieces that already work.
