import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { requireGym,requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin,handleApiError,requestMeta } from "@/lib/http";
const schema=z.object({name:z.string().min(2).max(120).optional(),logoUrl:z.string().url().nullable().optional(),description:z.string().max(2000).nullable().optional(),address:z.string().min(5).max(300).optional(),city:z.string().min(2).max(100).optional(),province:z.string().max(100).nullable().optional(),country:z.string().min(2).max(100).optional(),phone:z.string().min(7).max(30).optional(),email:z.string().email().optional(),website:z.string().url().nullable().optional(),primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),timezone:z.string().max(80).optional()});
export async function PATCH(req:NextRequest){try{assertSameOrigin(req);const actor=await requireUser(["GYM_OWNER"]);const gymId=requireGym(actor);const input=schema.parse(await req.json());const {primaryColor,accentColor,timezone,...gymData}=input;await db.$transaction([db.gym.update({where:{id:gymId},data:gymData}),db.gymSettings.upsert({where:{gymId},create:{gymId,primaryColor,accentColor,timezone},update:{primaryColor,accentColor,timezone}})]);await audit({gymId,actorId:actor.id,actorRole:actor.role,action:"GYM_PROFILE_UPDATED",targetType:"Gym",targetId:gymId,description:"Gym profile and branding updated",...requestMeta(req)});return NextResponse.json({ok:true})}catch(error){return handleApiError(error)}}

