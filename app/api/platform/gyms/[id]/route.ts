import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]) });
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["PLATFORM_OWNER"]); const { id } = await context.params; const { status } = schema.parse(await req.json());
    const gym = await db.gym.findUnique({ where: { id } }); if (!gym) throw new HttpError(404, "Gym not found");
    await db.gym.update({ where: { id }, data: { status } });
    await audit({ gymId: id, actorId: actor.id, actorRole: actor.role, action: `GYM_${status}`, targetType: "Gym", targetId: id, description: `${gym.name} set to ${status}`, ...requestMeta(req) });
    return NextResponse.json({ status });
  } catch (error) { return handleApiError(error); }
}
