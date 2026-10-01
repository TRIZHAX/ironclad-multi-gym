import { z } from "zod";

export const credentialsSchema = z.object({ identifier: z.string().trim().min(3).max(255), password: z.string().min(8).max(200) });

export const gymApplicationSchema = z.object({
  gymName: z.string().trim().min(2).max(120), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")), description: z.string().max(2000).optional(),
  address: z.string().trim().min(5).max(300), city: z.string().trim().min(2).max(100), province: z.string().max(100).optional(),
  country: z.string().trim().min(2).max(100), contactNumber: z.string().trim().min(7).max(30), email: z.string().email().max(255),
  website: z.string().url().max(500).optional().or(z.literal("")), gymType: z.string().trim().min(2).max(100),
  businessRegistration: z.string().trim().min(2).max(500), ownerFullName: z.string().trim().min(2).max(120),
  ownerUsername: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]+$/).min(3).max(40), ownerEmail: z.string().email().toLowerCase(),
  ownerPhone: z.string().trim().min(7).max(30), password: z.string().min(12).max(200)
});

export const memberSchema = z.object({
  fullName: z.string().trim().min(2).max(120), username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]+$/).min(3).max(40),
  email: z.string().email().toLowerCase(), phone: z.string().min(7).max(30).optional(), password: z.string().min(12).max(200),
  address: z.string().max(300).optional(), dateOfBirth: z.coerce.date().optional(), gender: z.string().max(30).optional(),
  emergencyContact: z.string().max(120).optional(), emergencyContactNumber: z.string().max(30).optional(), profilePhotoUrl: z.string().url().optional()
});

export const planSchema = z.object({
  name: z.string().trim().min(2).max(80), description: z.string().max(1000).optional(), priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("PHP"), durationDays: z.number().int().min(1).max(3650), accessRules: z.record(z.unknown()).optional()
});

