-- Only GRANTED entries receive entryDay. PostgreSQL allows multiple NULL values
-- in this unique index, so denied scans remain fully auditable.
ALTER TABLE "AccessLog" ADD COLUMN "entryDay" TEXT;
CREATE UNIQUE INDEX "AccessLog_gymId_memberId_entryDay_key"
ON "AccessLog"("gymId", "memberId", "entryDay");
