import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import QRCodeLib from "qrcode";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";
import { encryptToken } from "@/lib/crypto";

const schema = z.object({ memberId: z.string().cuid(), startDate: z.coerce.date(), expirationDate: z.coerce.date() }).refine(v => v.expirationDate > v.startDate, { message: "Expiration must follow start date" });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); const input = schema.parse(await req.json());
    const member = await db.memberProfile.findFirst({ where: { id: input.memberId, gymId }, include: { user: true } });
    if (!member) throw new HttpError(404, "Member not found in this gym");
    const token = `gymqr_${randomBytes(32).toString("base64url")}`;
    const qr = await db.qRCode.create({ data: { gymId, memberId: member.id, tokenHash: digest(token), tokenCiphertext: encryptToken(token), tokenPrefix: token.slice(0, 14), startDate: input.startDate, expirationDate: input.expirationDate, createdById: actor.id, status: "ACTIVE" } });
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: "QR_GENERATED", targetType: "QRCode", targetId: qr.id, description: `QR generated for ${member.memberNumber}`, ...requestMeta(req) });
    return NextResponse.json({ id: qr.id, token, imageDataUrl: await QRCodeLib.toDataURL(token, { width: 420, margin: 2, errorCorrectionLevel: "H" }), expirationDate: qr.expirationDate }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
