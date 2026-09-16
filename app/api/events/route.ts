import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Only admins can create events." }, { status: 403 });
  }

  const { title, description, date, type } = await request.json();
  if (!title || !date) return NextResponse.json({ error: "Title and date are required." }, { status: 400 });

  const event = await prisma.event.create({
    data: { title, description: description || null, date: new Date(date), type: type || "other" }
  });

  return NextResponse.json(event);
}
