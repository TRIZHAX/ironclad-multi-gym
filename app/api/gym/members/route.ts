import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";
import { memberSchema } from "@/lib/validation";

const createSchema = memberSchema.extend({ planId: z.string().cuid().optional(), membershipStart: z.coerce.date().optional() });

export async function GET() {
  try {
    const user = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(user);
    const members = await db.memberProfile.findMany({ where: { gymId }, include: { user: { select: { fullName: true, username: true, email: true, phone: true, status: true } }, memberships: { orderBy: { endDate: "desc" }, take: 1, include: { plan: true } }, qrCodes: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ members });
  } catch (error) { return handleApiError(error); }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req); const actor = await requireUser(["GYM_OWNER", "ADMIN"]); const gymId = requireGym(actor); const input = createSchema.parse(await req.json());
    const duplicate = await db.user.findFirst({ where: { OR: [{ username: input.username }, { email: input.email }] } }); if (duplicate) throw new HttpError(409, "Username or email already exists");
    const plan = input.planId ? await db.membershipPlan.findFirst({ where: { id: input.planId, gymId, isActive: true } }) : null;
    if (input.planId && !plan) throw new HttpError(404, "Membership plan not found in this gym");
    const member = await db.$transaction(async tx => {
      const counter = await tx.gym.update({ where: { id: gymId }, data: { memberSequence: { increment: 1 } }, select: { memberSequence: true } });
      const memberNumber = `${actor.gym!.code}-MEM-${String(counter.memberSequence).padStart(6,"0")}`;
      const user = await tx.user.create({ data: { gymId, fullName: input.fullName, username: input.username, email: input.email, phone: input.phone, passwordHash: await hash(input.password, 12), role: "MEMBER", status: "ACTIVE" } });
      const profile = await tx.memberProfile.create({ data: { gymId, userId: user.id, memberNumber, address: input.address, dateOfBirth: input.dateOfBirth, gender: input.gender, emergencyContact: input.emergencyContact, emergencyContactNumber: input.emergencyContactNumber, profilePhotoUrl: input.profilePhotoUrl } });
      if (plan) { const start = input.membershipStart ?? new Date(); const end = new Date(start.getTime() + plan.durationDays * 86_400_000); await tx.membership.create({ data: { gymId, memberId: profile.id, planId: plan.id, startDate: start, endDate: end, status: "ACTIVE", createdBy: actor.id } }); }
      return profile;
    });
    await audit({ gymId, actorId: actor.id, actorRole: actor.role, action: "MEMBER_CREATED", targetType: "MemberProfile", targetId: member.id, description: `${input.fullName} registered as ${member.memberNumber}`, ...requestMeta(req) });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
