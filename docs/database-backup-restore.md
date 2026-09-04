# Database backup and restore

Railway production must use its managed PostgreSQL backup facility. Configure
automated backups, retention, access, and notifications in Railway for each
environment independently. Never commit or print `DATABASE_URL` or backup
credentials.

## Restore exercise

Run this only against a disposable Compose stack or an isolated managed-
PostgreSQL restore target:

```bash
npm run compose:up
npm run test:backup-restore
npm run compose:down
```

The check writes one sentinel room to the local Compose database, creates a
`pg_dump`, restores it into a separate `paircode_restore_check` database, and
verifies the sentinel value. It never drops the source database. The trap
removes the temporary dump and restore database.

For a managed restore, select a point-in-time or backup copy, restore it into a
new isolated PostgreSQL service, set `DATABASE_URL` only in the isolated app,
run the health and room integration checks, and record the restore timestamp,
source backup identifier, target, and result in the secure operations log.
Do not point production at the restore target until a separately reviewed
recovery plan authorizes it.
