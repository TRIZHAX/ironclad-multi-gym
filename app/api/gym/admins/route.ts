import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";

const schema = z.object({ fullName: z.string().min(2).max(120), username: z.string().regex(/^[a-z0-9._-]+$/).min(3).max(40), email: z.string().email(), phone: z.string().max(30).optional(), password: z.string().min(12).max(200) });
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER"]); const gymId = requireGym(actor); const input = schema.parse(await req.json());
    if (await db.user.findFirst({ where: { OR: [{ username: input.username }, { email: input.email }] } })) throw new HttpError(409, "Username or email already exists");
    const {password,...profile}=input; const admin = await db.user.create({ data: { ...profile, passwordHash: await hash(password, 12), username: input.username.toLowerCase(), email: input.email.toLowerCase(), gymId, role: "ADMIN", status: "ACTIVE" } });
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: "ADMIN_CREATED", targetType: "User", targetId: admin.id, description: `${admin.username} added as admin`, ...requestMeta(req) });
    return NextResponse.json({ id: admin.id }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
