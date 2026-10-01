import { NextRequest } from "next/server";
import { z } from "zod";
import { requireGym,requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/http";
const query=z.object({from:z.coerce.date(),to:z.coerce.date()}).refine(x=>x.to>=x.from);
const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;
export async function GET(req:NextRequest){try{const actor=await requireUser(["GYM_OWNER","ADMIN"]);const gymId=requireGym(actor);const {from,to}=query.parse(Object.fromEntries(req.nextUrl.searchParams));const rows=await db.accessLog.findMany({where:{gymId,scannedAt:{gte:from,lte:to}},include:{member:{include:{user:{select:{fullName:true}}}},scannedBy:{select:{username:true}}},orderBy:{scannedAt:"desc"}});const csv=[["Entry","Member","Result","Reason","Scanned By","Date"],...rows.map(x=>[x.entryNumber,x.member?.user.fullName??"",x.result,x.reason,x.scannedBy.username,x.scannedAt.toISOString()])].map(r=>r.map(esc).join(",")).join("\n");return new Response(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="attendance-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv"`}})}catch(error){return handleApiError(error)}}
