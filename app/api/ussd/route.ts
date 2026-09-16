import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Africa's Talking sends form-encoded POST requests
// Response must be plain text starting with CON (continue) or END (terminate)

// Required: bypass ngrok browser warning for non-browser clients
export const runtime = "nodejs";

function con(text: string) {
  return new NextResponse(`CON ${text}`, {
    headers: { "Content-Type": "text/plain", "ngrok-skip-browser-warning": "true" },
  });
}

function end(text: string) {
  return new NextResponse(`END ${text}`, {
    headers: { "Content-Type": "text/plain", "ngrok-skip-browser-warning": "true" },
  });
}

// Parse the USSD input chain into an array of choices
// e.g. "1*2*3" → ["1", "2", "3"]
function parseInput(text: string): string[] {
  if (!text || text.trim() === "") return [];
  return text.split("*").map((s) => s.trim()).filter(Boolean);
}

// Truncate lesson content to fit USSD screen (182 chars max per response)
function truncate(text: string, max = 160): string {
  const clean = text.replace(/\n+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 3) + "...";
}

export async function POST(req: NextRequest) {
  // Africa's Talking sends form-encoded body
  const body = await req.text();
  const params = new URLSearchParams(body);

  const sessionId = params.get("sessionId") ?? "";
  const phoneNumber = params.get("phoneNumber") ?? "";
  const text = params.get("text") ?? "";

  const inputs = parseInput(text);
  const level = inputs.length;

  // ── Level 0 — Main menu ──────────────────────────────────────────────────
  if (level === 0) {
    return con(
      "Welcome to RUNDA Tech Club\n" +
      "1. Browse Lessons\n" +
      "2. My Progress\n" +
      "3. About RUNDA\n" +
      "0. Exit"
    );
  }

  const main = inputs[0];

  // ── Exit ─────────────────────────────────────────────────────────────────
  if (main === "0") {
    return end("Thank you for learning with RUNDA. Goodbye!");
  }

  // ── About ─────────────────────────────────────────────────────────────────
  if (main === "3") {
    return end(
      "RUNDA Tech Club\n" +
      "A digital learning platform for TVET students in Rwanda.\n" +
      "Learn Python, Math, Web Dev & Blockchain — even offline.\n" +
      "Visit: runda.vercel.app"
    );
  }

  // ── My Progress ───────────────────────────────────────────────────────────
  if (main === "2") {
    // Look up user by phone number
    const profile = await prisma.userProfile.findFirst({
      where: { phone: phoneNumber },
      select: { name: true, role: true, status: true },
    }).catch(() => null);

    if (!profile || profile.status !== "approved") {
      return end(
        "Your phone number is not linked to a RUNDA account.\n" +
        "Register at: runda.vercel.app"
      );
    }

    const lessonCount = await prisma.lesson.count({
      where: {
        OR: [{ tierVisibility: "all" }, { tierVisibility: profile.role }],
      },
    });

    return end(
      `Hello ${profile.name ?? "Member"}!\n` +
      `Level: ${profile.role.toUpperCase()}\n` +
      `Lessons available to you: ${lessonCount}\n` +
      `Visit runda.vercel.app for full access.`
    );
  }

  // ── Browse Lessons ────────────────────────────────────────────────────────
  if (main === "1") {

    // Level 1 — show subjects
    if (level === 1) {
      const subjects = await prisma.lesson.findMany({
        distinct: ["subject"],
        select: { subject: true },
        orderBy: { subject: "asc" },
      });

      if (!subjects.length) {
        return end("No lessons available yet. Check back soon!");
      }

      const menu = subjects
        .map((s, i) => `${i + 1}. ${s.subject}`)
        .join("\n");

      return con(`Select a subject:\n${menu}\n0. Back`);
    }

    // Level 2 — show lessons in chosen subject
    if (level === 2) {
      if (inputs[1] === "0") {
        return con(
          "Welcome to RUNDA Tech Club\n" +
          "1. Browse Lessons\n" +
          "2. My Progress\n" +
          "3. About RUNDA\n" +
          "0. Exit"
        );
      }

      const subjectIndex = parseInt(inputs[1]) - 1;
      const subjects = await prisma.lesson.findMany({
        distinct: ["subject"],
        select: { subject: true },
        orderBy: { subject: "asc" },
      });

      if (subjectIndex < 0 || subjectIndex >= subjects.length) {
        return end("Invalid selection. Please try again.");
      }

      const chosenSubject = subjects[subjectIndex].subject;
      const lessons = await prisma.lesson.findMany({
        where: { subject: chosenSubject },
        orderBy: { order: "asc" },
        select: { id: true, title: true, order: true },
      });

      const menu = lessons
        .map((l, i) => `${i + 1}. ${truncate(l.title, 40)}`)
        .join("\n");

      return con(`${chosenSubject}:\n${menu}\n0. Back`);
    }

    // Level 3 — show lesson content (first chunk)
    if (level === 3) {
      if (inputs[2] === "0") {
        // Go back to subject list
        const subjects = await prisma.lesson.findMany({
          distinct: ["subject"],
          select: { subject: true },
          orderBy: { subject: "asc" },
        });
        const menu = subjects.map((s, i) => `${i + 1}. ${s.subject}`).join("\n");
        return con(`Select a subject:\n${menu}\n0. Back`);
      }

      const subjectIndex = parseInt(inputs[1]) - 1;
      const lessonIndex = parseInt(inputs[2]) - 1;

      const subjects = await prisma.lesson.findMany({
        distinct: ["subject"],
        select: { subject: true },
        orderBy: { subject: "asc" },
      });

      if (subjectIndex < 0 || subjectIndex >= subjects.length) {
        return end("Invalid selection.");
      }

      const chosenSubject = subjects[subjectIndex].subject;
      const lessons = await prisma.lesson.findMany({
        where: { subject: chosenSubject },
        orderBy: { order: "asc" },
      });

      if (lessonIndex < 0 || lessonIndex >= lessons.length) {
        return end("Invalid selection.");
      }

      const lesson = lessons[lessonIndex];

      // Split content into chunks of 140 chars for USSD screen
      const chunks = chunkContent(lesson.content, 140);
      const firstChunk = chunks[0];
      const hasMore = chunks.length > 1;

      return con(
        `${lesson.title}\n` +
        `─────────────\n` +
        `${firstChunk}\n` +
        (hasMore ? "1. Continue reading\n" : "") +
        "0. Back to lessons"
      );
    }

    // Level 4 — continue reading (chunk 2)
    if (level === 4) {
      if (inputs[3] === "0") {
        // Back to lesson list
        const subjectIndex = parseInt(inputs[1]) - 1;
        const subjects = await prisma.lesson.findMany({
          distinct: ["subject"],
          select: { subject: true },
          orderBy: { subject: "asc" },
        });
        const chosenSubject = subjects[subjectIndex]?.subject;
        const lessons = await prisma.lesson.findMany({
          where: { subject: chosenSubject },
          orderBy: { order: "asc" },
          select: { id: true, title: true },
        });
        const menu = lessons.map((l, i) => `${i + 1}. ${truncate(l.title, 40)}`).join("\n");
        return con(`${chosenSubject}:\n${menu}\n0. Back`);
      }

      if (inputs[3] === "1") {
        const subjectIndex = parseInt(inputs[1]) - 1;
        const lessonIndex = parseInt(inputs[2]) - 1;

        const subjects = await prisma.lesson.findMany({
          distinct: ["subject"],
          select: { subject: true },
          orderBy: { subject: "asc" },
        });
        const chosenSubject = subjects[subjectIndex]?.subject;
        const lessons = await prisma.lesson.findMany({
          where: { subject: chosenSubject },
          orderBy: { order: "asc" },
        });
        const lesson = lessons[lessonIndex];
        const chunks = chunkContent(lesson.content, 140);
        const secondChunk = chunks[1] ?? chunks[0];
        const hasMore = chunks.length > 2;

        return con(
          `${lesson.title} (cont.)\n` +
          `${secondChunk}\n` +
          (hasMore ? "1. Continue reading\n" : "") +
          "0. Back to lessons"
        );
      }
    }

    // Level 5 — chunk 3
    if (level === 5 && inputs[4] === "1") {
      const subjectIndex = parseInt(inputs[1]) - 1;
      const lessonIndex = parseInt(inputs[2]) - 1;

      const subjects = await prisma.lesson.findMany({
        distinct: ["subject"],
        select: { subject: true },
        orderBy: { subject: "asc" },
      });
      const chosenSubject = subjects[subjectIndex]?.subject;
      const lessons = await prisma.lesson.findMany({
        where: { subject: chosenSubject },
        orderBy: { order: "asc" },
      });
      const lesson = lessons[lessonIndex];
      const chunks = chunkContent(lesson.content, 140);
      const thirdChunk = chunks[2] ?? chunks[chunks.length - 1];

      return end(
        `${lesson.title} (end)\n` +
        `${thirdChunk}\n` +
        `─────────────\n` +
        `Visit runda.vercel.app for full lesson.`
      );
    }
  }

  return end("Invalid input. Please dial again.");
}

// Split long text into screen-sized chunks
function chunkContent(text: string, size: number): string[] {
  // Clean up the text — collapse multiple newlines and spaces
  const clean = text
    .replace(/─+/g, "")
    .replace(/={3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks: string[] = [];
  let remaining = clean;

  while (remaining.length > 0) {
    if (remaining.length <= size) {
      chunks.push(remaining.trim());
      break;
    }
    // Break at last space before size limit
    let breakAt = remaining.lastIndexOf(" ", size);
    if (breakAt <= 0) breakAt = size;
    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  return chunks;
}
