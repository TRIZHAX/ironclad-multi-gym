import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, rateLimit, requestMeta } from "@/lib/http";
import { evaluateAccess } from "@/lib/access-policy";
import { gymCalendarDay } from "@/lib/gym-day";

const schema = z.object({ token: z.string().min(20).max(500) });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const REPEAT_ENTRY_REASON = "Already checked in today. One entry per day is allowed.";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser(["GYM_OWNER", "ADMIN"]);
    if (!actor.gymId || !actor.gym) throw new HttpError(403, "No gym assigned");
    const meta = requestMeta(req);
    rateLimit(`scan:${actor.id}`, 120, 60_000);
    const { token } = schema.parse(await req.json());
    const now = new Date();
    const found = await db.qRCode.findUnique({
      where: { tokenHash: digest(token) },
      include: { gym: true, member: { include: { user: true, memberships: { include: { plan: true }, orderBy: { endDate: "desc" } } } } },
    });
    const decision = evaluateAccess({
      scannerGymId: actor.gymId, scannerGymStatus: actor.gym.status,
      qr: found ? { gymId: found.gymId, status: found.status, startDate: found.startDate, expirationDate: found.expirationDate, memberStatus: found.member.user.status, memberships: found.member.memberships } : null,
    }, now);
    let allowed = decision.allowed;
    let reason = decision.reason;
    const safeQr = found?.gymId === actor.gymId ? found : null;
    if (safeQr && safeQr.expirationDate <= now && safeQr.status === "ACTIVE") {
      await db.qRCode.update({ where: { id: safeQr.id }, data: { status: "EXPIRED" } });
    }

    const entryDay = allowed ? gymCalendarDay(now, actor.gym.settings?.timezone) : null;
    let log;
    if (allowed && safeQr && entryDay) {
      try {
        // The database unique constraint is the concurrency guard. Two scanners racing
        // for the same member/gym/day cannot both create a granted entry.
        log = await db.accessLog.create({ data: {
          entryNumber: `ENTRY-${randomUUID().slice(0, 8).toUpperCase()}`,
          gymId: actor.gymId, memberId: safeQr.memberId, qrCodeId: safeQr.id,
          scannedById: actor.id, scannerRole: actor.role, result: "GRANTED",
          reason, deviceInfo: meta.deviceInfo, entryDay,
        } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        const target = error.meta?.target;
        const dailyEntryConflict = Array.isArray(target)
          ? target.includes("entryDay")
          : String(target ?? "").includes("entryDay");
        if (!dailyEntryConflict) throw error;
        allowed = false;
        reason = REPEAT_ENTRY_REASON;
        log = await db.accessLog.create({ data: {
          entryNumber: `ENTRY-${randomUUID().slice(0, 8).toUpperCase()}`,
          gymId: actor.gymId, memberId: safeQr.memberId, qrCodeId: safeQr.id,
          scannedById: actor.id, scannerRole: actor.role, result: "DENIED",
          reason, deviceInfo: meta.deviceInfo, entryDay: null,
        } });
      }
    } else {
      log = await db.accessLog.create({ data: {
        entryNumber: `ENTRY-${randomUUID().slice(0, 8).toUpperCase()}`,
        gymId: actor.gymId, memberId: safeQr?.memberId, qrCodeId: safeQr?.id,
        scannedById: actor.id, scannerRole: actor.role, result: "DENIED",
        reason, deviceInfo: meta.deviceInfo, entryDay: null,
      } });
    }

    await audit({ gymId: actor.gymId, actorId: actor.id, actorRole: actor.role, action: allowed ? "ACCESS_GRANTED" : "ACCESS_DENIED", targetType: "AccessLog", targetId: log.id, description: reason, ...meta });
    return NextResponse.json({
      allowed, reason, scannedAt: log.scannedAt, entryNumber: log.entryNumber,
      member: safeQr ? { fullName: safeQr.member.user.fullName, username: safeQr.member.user.username, memberNumber: safeQr.member.memberNumber } : null,
      gym: actor.gym.name,
      membership: safeQr?.member.memberships[0] ? { plan: safeQr.member.memberships[0].plan.name, status: safeQr.member.memberships[0].status } : null,
      qr: safeQr ? { status: safeQr.status, expirationDate: safeQr.expirationDate } : null,
      scannedBy: actor.username,
    });
  } catch (error) { return handleApiError(error); }
}
