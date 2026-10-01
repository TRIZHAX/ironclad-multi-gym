import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGym, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, HttpError, requestMeta } from "@/lib/http";

const schema=z.object({memberId:z.string().cuid(),planId:z.string().cuid(),startDate:z.coerce.date().default(()=>new Date())});
export async function POST(req:NextRequest){try{assertSameOrigin(req);const actor=await requireUser(["GYM_OWNER","ADMIN"]);const gymId=requireGym(actor);const input=schema.parse(await req.json());const [member,plan]=await Promise.all([db.memberProfile.findFirst({where:{id:input.memberId,gymId}}),db.membershipPlan.findFirst({where:{id:input.planId,gymId,isActive:true}})]);if(!member||!plan)throw new HttpError(404,"Member or plan not found in this gym");const endDate=new Date(input.startDate.getTime()+plan.durationDays*86400000);const membership=await db.$transaction(async tx=>{await tx.membership.updateMany({where:{gymId,memberId:member.id,status:"ACTIVE"},data:{status:"CANCELLED"}});return tx.membership.create({data:{gymId,memberId:member.id,planId:plan.id,startDate:input.startDate,endDate,status:"ACTIVE",createdBy:actor.id}})});await audit({gymId,actorId:actor.id,actorRole:actor.role,action:"MEMBERSHIP_CREATED",targetType:"Membership",targetId:membership.id,description:`${plan.name} assigned to ${member.memberNumber}`,...requestMeta(req)});return NextResponse.json({membership},{status:201})}catch(error){return handleApiError(error)}}

