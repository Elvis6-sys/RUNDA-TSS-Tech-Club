import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check if database is accessible - simple query
    await prisma.userProfile.count();
    return NextResponse.json({ status: "ok", auth: "ready" });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
