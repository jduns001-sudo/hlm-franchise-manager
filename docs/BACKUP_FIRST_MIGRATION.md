# Phase 2 Mission 18 — Backup-First Migration Package

A prepared legacy migration must produce and re-validate a portable backup before any persistence transaction can be designed or enabled.

`createBackupFirstMigrationPackage` runs the complete non-destructive migration preparation, exports the resulting GameState through the existing save-transfer boundary, then imports/validates that export in memory. If preparation or backup validation fails, the package is rejected.

Even after a valid backup is produced, this mission returns `persistenceAllowed:false` and `persistencePerformed:false`. It does not read or write browser storage and does not alter the live Front Office.

The next step is to define an atomic persistence transaction with rollback behavior before browser integration.
