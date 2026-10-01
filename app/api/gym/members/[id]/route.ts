import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";

const schema = z.object({ fullName: z.string().min(2).max(120).optional(), phone: z.string().max(30).nullable().optional(), address: z.string().max(300).nullable().optional(), status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]).optional() });
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); const { id } = await context.params; const input = schema.parse(await req.json());
    const member = await db.memberProfile.findFirst({ where: { id, gymId } }); if (!member) throw new HttpError(404, "Member not found");
    await db.$transaction([db.memberProfile.update({ where: { id }, data: { address: input.address } }), db.user.update({ where: { id: member.userId }, data: { fullName: input.fullName, phone: input.phone, status: input.status } })]);
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: "MEMBER_UPDATED", targetType: "MemberProfile", targetId: id, description: "Member record updated", ...requestMeta(req) });
    return NextResponse.json({ ok: true });
  } catch (error) { return handleApiError(error); }
}

