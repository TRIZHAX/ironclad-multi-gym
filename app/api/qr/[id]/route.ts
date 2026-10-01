import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";
import type { Prisma } from "@prisma/client";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("EXTEND"), days: z.number().int().min(1).max(3650).optional(), expirationDate: z.coerce.date().optional(), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal("BAN"), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal("UNBAN"), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal("REVOKE"), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal("SUSPEND"), reason: z.string().min(3).max(500) })
]);

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); const { id } = await context.params; const input = schema.parse(await req.json());
    const qr = await db.qRCode.findFirst({ where: { id, gymId } }); if (!qr) throw new HttpError(404, "QR code not found");
    if (qr.status === "REVOKED") throw new HttpError(409, "A revoked QR code cannot be changed");
    let update: Prisma.QRCodeUpdateInput = {}; let oldExpiration: Date | undefined; let newExpiration: Date | undefined;
    if (input.action === "EXTEND") { if (!input.days && !input.expirationDate) throw new HttpError(400,"Days or expiration date is required"); oldExpiration = qr.expirationDate; const calculated = input.expirationDate ?? new Date(qr.expirationDate.getTime() + (input.days ?? 0) * 86_400_000); if (calculated <= qr.expirationDate) throw new HttpError(400, "New expiration must be later"); newExpiration=calculated; update = { expirationDate: calculated, status: qr.status === "EXPIRED" ? "ACTIVE" : qr.status }; }
    if (input.action === "BAN") update = { status: "BANNED", banReason: input.reason };
    if (input.action === "UNBAN") { if (qr.status !== "BANNED") throw new HttpError(409, "QR is not banned"); update = { status: qr.expirationDate > new Date() ? "ACTIVE" : "EXPIRED", banReason: null }; }
    if (input.action === "REVOKE") update = { status: "REVOKED", revokedAt: new Date(), revokedById: actor.id };
    if (input.action === "SUSPEND") update = { status: "SUSPENDED" };
    await db.$transaction([db.qRCode.update({ where: { id }, data: update }), db.qRCodeAction.create({ data: { qrCodeId: id, gymId, action: input.action, oldExpiration, newExpiration, reason: input.reason, actorId: actor.id } })]);
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: `QR_${input.action}`, targetType: "QRCode", targetId: id, description: `QR ${input.action.toLowerCase()}: ${input.reason}`, ...requestMeta(req) });
    return NextResponse.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}
