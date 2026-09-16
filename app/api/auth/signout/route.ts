import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/local-auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
