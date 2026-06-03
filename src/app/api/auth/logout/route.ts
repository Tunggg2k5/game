import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = ok({ ok: true }) as NextResponse;
  clearSessionCookie(response);
  return response;
}
