import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { compare } from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { db } from "./db";
import { HttpError } from "./http";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "ironclad_session";
const ttlHours = Number(process.env.SESSION_TTL_HOURS ?? 168);
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function verifyPassword(password: string, hash: string) { return compare(password, hash); }

export async function createSession(userId: string, meta: { ipAddress?: string | null; deviceInfo?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, ...meta } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { gym: { include: { settings: true } }, memberProfile: true } } }
  });
  if (!session || session.expiresAt <= new Date() || session.user.status !== UserStatus.ACTIVE) return null;
  return session.user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireUser(roles?: UserRole[]) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Authentication required");
  if (roles && !roles.includes(user.role)) throw new HttpError(403, "Insufficient permission");
  return user;
}

export async function requirePageUser(roles?: UserRole[]) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(user.role === "PLATFORM_OWNER" ? "/platform/dashboard" : user.role === "MEMBER" ? "/member/dashboard" : "/gym/dashboard");
  return user;
}

export function requireGym(user: AuthUser) {
  if (!user.gymId || !user.gym) throw new HttpError(403, "No gym is assigned to this account");
  if (user.gym.status !== "ACTIVE") throw new HttpError(403, `Gym is ${user.gym.status.toLowerCase()}`);
  return user.gymId;
}

