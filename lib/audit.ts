import { Prisma, UserRole } from "@prisma/client";
import { db } from "./db";

export async function audit(data: {
  gymId?: string | null; actorId?: string | null; actorRole?: UserRole | null; action: string;
  targetType: string; targetId?: string | null; description: string; metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null; deviceInfo?: string | null;
}) {
  return db.auditLog.create({ data });
}

