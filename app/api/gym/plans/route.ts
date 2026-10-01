import { NextRequest, NextResponse } from "next/server";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, requestMeta } from "@/lib/http";
import { planSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try { const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); return NextResponse.json({ plans: await db.membershipPlan.findMany({ where: { gymId }, orderBy: { createdAt: "desc" } }) }); }
  catch (error) { return handleApiError(error); }
}
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); const input = planSchema.parse(await req.json());
    const plan = await db.membershipPlan.create({ data: { ...input, accessRules: input.accessRules as Prisma.InputJsonValue | undefined, gymId } });
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: "MEMBERSHIP_PLAN_CREATED", targetType: "MembershipPlan", targetId: plan.id, description: `${plan.name} plan created`, ...requestMeta(req) });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
