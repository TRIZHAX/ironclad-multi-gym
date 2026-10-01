# One granted entry per member per gym per local day

This update adds a nullable `AccessLog.entryDay` field and a PostgreSQL unique constraint on `(gymId, memberId, entryDay)`. Successful scans write the gym-local `YYYY-MM-DD` key. Denied scans use `NULL`, so repeat-denial audit logs remain unrestricted. The database uniqueness constraint is the concurrency guard for simultaneous scans.

## Deploy steps

1. Back up the production database before applying schema changes.
2. Commit and push this code to GitHub/Vercel.
3. Apply the migration against the production database using the production database URL in a secure terminal/environment: `npx prisma migrate deploy`. Do not paste database credentials into chat or commit environment files.
4. Regenerate Prisma Client/build if your deployment pipeline does not already run `prisma generate`: `npx prisma generate && npm run build`.
5. Test the first scan, repeat scan, next-day scan, and simultaneous scans.

The gym timezone is read from `GymSettings.timezone`; if it is missing or invalid, the day key falls back to UTC. The default schema timezone is UTC, so configure each gym's timezone (for example, `Asia/Manila`) if its business day should follow local time.

Historical logs have `entryDay = NULL` after migration and do not retroactively block the first scan on the deployment day. QR validity, membership checks, gym authorization, QR encryption, and audit logging remain in place.
