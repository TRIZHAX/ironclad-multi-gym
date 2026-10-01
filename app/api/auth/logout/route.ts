import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertSameOrigin, handleApiError } from "@/lib/http";
export async function POST(req: NextRequest) {
  try { assertSameOrigin(req); await destroySession(); return NextResponse.json({ ok: true }); }
  catch (error) { return handleApiError(error); }
}

