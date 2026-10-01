import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { assertSameOrigin, handleApiError, HttpError, rateLimit, requestMeta } from "@/lib/http";
import { gymApplicationSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const meta = requestMeta(req);
    rateLimit(`application:${meta.ipAddress ?? "unknown"}`, 3, 60 * 60_000);
    const input = gymApplicationSchema.parse(await req.json());
    const duplicate = await db.gymApplication.findFirst({ where: { OR: [{ slug: input.slug }, { ownerUsername: input.ownerUsername }, { ownerEmail: input.ownerEmail }] } });
    const existingUser = await db.user.findFirst({ where: { OR: [{ username: input.ownerUsername }, { email: input.ownerEmail }] } });
    if (duplicate || existingUser) throw new HttpError(409, "Gym slug, owner username, or owner email is already registered");
    const { password, ...data } = input;
    const application = await db.gymApplication.create({ data: { ...data, logoUrl: data.logoUrl || null, website: data.website || null, ownerPasswordHash: await hash(password, 12) } });
    await audit({ action: "GYM_APPLICATION_CREATED", targetType: "GymApplication", targetId: application.id, description: `${application.gymName} submitted an application`, ...meta });
    return NextResponse.json({ id: application.id, status: application.status }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

