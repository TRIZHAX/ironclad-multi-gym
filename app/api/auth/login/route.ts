import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { assertSameOrigin, handleApiError, HttpError, rateLimit, requestMeta } from "@/lib/http";
import { credentialsSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const meta = requestMeta(req);
    rateLimit(`login:${meta.ipAddress ?? "unknown"}`, 8, 15 * 60_000);
    const { identifier, password } = credentialsSchema.parse(await req.json());
    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }] }, include: { gym: true }
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw new HttpError(401, "Invalid credentials");
    if (user.status !== "ACTIVE") throw new HttpError(403, "Account is not active");
    if (user.role !== "PLATFORM_OWNER" && user.gym?.status !== "ACTIVE") throw new HttpError(403, "Gym is not active");
    await createSession(user.id, meta);
    await audit({ gymId: user.gymId, actorId: user.id, actorRole: user.role, action: "USER_LOGIN", targetType: "User", targetId: user.id, description: `${user.username} signed in`, ...meta });
    const redirectTo = user.role === "PLATFORM_OWNER" ? "/platform/dashboard" : user.role === "MEMBER" ? "/member/dashboard" : "/gym/dashboard";
    return NextResponse.json({ redirectTo });
  } catch (error) { return handleApiError(error); }
}

