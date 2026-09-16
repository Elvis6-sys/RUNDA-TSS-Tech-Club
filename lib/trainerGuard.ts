/**
 * trainerGuard.ts
 *
 * Shared permission helpers for trainer-scoped mutations.
 *
 * A trainer may mutate content (lessons, resources, challenges, skill nodes)
 * only when that content belongs to a SkillTrack they are assigned to.
 *
 * Admins always pass every check.
 */

import { prisma } from "@/lib/prisma";

export type CallerProfile = {
  id: string;
  role: string;
};

/**
 * Resolve the calling user's profile from a Supabase user id.
 * Returns null if the user has no profile or is not approved
 * (trainers are approved on creation).
 */
export async function getCallerProfile(userId: string): Promise<CallerProfile | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!profile) return null;
  return profile;
}

/**
 * Returns true if the caller is an admin (always allowed) or a trainer
 * who is assigned to the given trackId.
 */
export async function canManageTrack(
  caller: CallerProfile,
  trackId: string
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (caller.role !== "trainer") return false;

  const assignment = await prisma.trainerModule.findFirst({
    where: {
      trainerId: caller.id,
      trackId: trackId
    },
    select: { id: true },
  });
  return !!assignment;
}

/**
 * Returns true if the caller may manage the given lesson.
 * Admin → always yes.
 * Trainer → yes only if the lesson's subject matches a SkillTrack they own.
 *
 * We match by subject string (Lesson.subject === SkillTrack.name).
 * If the lesson has an explicit trainerId, that overrides the subject check.
 */
export async function canManageLesson(
  caller: CallerProfile,
  lessonId: string
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (caller.role !== "trainer") return false;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { trainerId: true, subject: true },
  });
  if (!lesson) return false;

  // Explicit ownership takes precedence
  if (lesson.trainerId !== null) return lesson.trainerId === caller.id;

  // Fall back to subject → track match
  return isTrainerForSubject(caller.id, lesson.subject);
}

/**
 * Returns true if the caller may manage the given resource.
 * Trainer matches by subject field on the resource.
 */
export async function canManageResource(
  caller: CallerProfile,
  resourceId: string
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (caller.role !== "trainer") return false;

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { trainerId: true, subject: true },
  });
  if (!resource) return false;

  if (resource.trainerId !== null) return resource.trainerId === caller.id;
  if (!resource.subject) return false;
  return isTrainerForSubject(caller.id, resource.subject);
}

/**
 * Returns true if the caller may manage the given challenge.
 */
export async function canManageChallenge(
  caller: CallerProfile,
  challengeId: string
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (caller.role !== "trainer") return false;

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { trainerId: true },
  });
  if (!challenge) return false;
  return challenge.trainerId === caller.id;
}

/**
 * Returns true if the caller may manage the given skill node.
 * Resolved via the node's parent track.
 */
export async function canManageNode(
  caller: CallerProfile,
  nodeId: string
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (caller.role !== "trainer") return false;

  const node = await prisma.skillNode.findUnique({
    where: { id: nodeId },
    select: { trackId: true },
  });
  if (!node) return false;
  return canManageTrack(caller, node.trackId);
}

// ─── internal ────────────────────────────────────────────────────────────────

async function isTrainerForSubject(trainerId: string, subject: string): Promise<boolean> {
  const track = await prisma.skillTrack.findFirst({
    where: { name: subject },
    select: { id: true },
  });
  if (!track) return false;
  return canManageTrack({ id: trainerId, role: "trainer" }, track.id);
}
