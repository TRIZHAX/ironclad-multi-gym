import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";

const reviewSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), rejectionReason: z.string().trim().min(3).max(1000).optional() })
  .refine(v => v.decision !== "REJECT" || !!v.rejectionReason, { message: "Rejection reason is required" });

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser(["PLATFORM_OWNER"]);
    const { id } = await context.params;
    const input = reviewSchema.parse(await req.json());
    const application = await db.gymApplication.findUnique({ where: { id } });
    if (!application || application.status !== "PENDING") throw new HttpError(409, "Application is not pending");
    const meta = requestMeta(req);
    if (input.decision === "REJECT") {
      await db.gymApplication.update({ where: { id }, data: { status: "REJECTED", rejectionReason: input.rejectionReason, ownerPasswordHash: "REDACTED_AFTER_REJECTION", reviewedAt: new Date(), reviewedById: actor.id } });
      await audit({ actorId: actor.id, actorRole: actor.role, action: "GYM_REJECTED", targetType: "GymApplication", targetId: id, description: `${application.gymName} rejected: ${input.rejectionReason}`, ...meta });
      return NextResponse.json({ status: "REJECTED" });
    }
    const result = await db.$transaction(async tx => {
      const codeRoot = application.slug.replace(/-/g, "").slice(0, 5).toUpperCase();
      const owner = await tx.user.create({ data: { username: application.ownerUsername, email: application.ownerEmail, passwordHash: application.ownerPasswordHash, fullName: application.ownerFullName, phone: application.ownerPhone, role: "GYM_OWNER", status: "ACTIVE" } });
      const gym = await tx.gym.create({ data: { code: `${codeRoot}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`, name: application.gymName, slug: application.slug, logoUrl: application.logoUrl, description: application.description, address: application.address, city: application.city, province: application.province, country: application.country, phone: application.contactNumber, email: application.email, website: application.website, gymType: application.gymType, businessInfo: application.businessRegistration, status: "ACTIVE", ownerId: owner.id, settings: { create: {} } } });
      await tx.user.update({ where: { id: owner.id }, data: { gymId: gym.id } });
      await tx.gymApplication.update({ where: { id }, data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: actor.id, gymId: gym.id } });
      return { gym, owner };
    });
    await audit({ gymId: result.gym.id, actorId: actor.id, actorRole: actor.role, action: "GYM_APPROVED", targetType: "Gym", targetId: result.gym.id, description: `${result.gym.name} approved and owner assigned`, ...meta });
    return NextResponse.json({ status: "APPROVED", gymId: result.gym.id });
  } catch (error) { return handleApiError(error); }
}
