/**
 * Centralised chat-room access rules.
 *
 * Rules:
 *  - GENERAL rooms (tierVisibility === null):  everyone can access
 *  - TIER rooms:
 *      admin     → all rooms
 *      alumni    → General + Alumni Lounge + L3/L4/L5 (read-along)
 *      l5        → General + L5 Room
 *      l4        → General + L4 Room
 *      l3        → General + L3 Room
 *      trainer   → General + any tier room whose level matches
 *                   one of their assigned module tiers
 *      (no other role should reach here with "approved" status)
 *
 * The "tier order" is only used for admin/alumni escalation.
 */

export type RoomRow = {
  id: string;
  name: string;
  type: string;
  tierVisibility: string | null;
};

/** Tier rooms that a student of a given role can access. */
const STUDENT_TIER_MAP: Record<string, string[]> = {
  l3:     ["l3"],
  l4:     ["l4"],
  l5:     ["l5"],
  alumni: ["l3", "l4", "l5", "alumni"],
  admin:  ["l3", "l4", "l5", "alumni", "admin"],
};

/**
 * Returns only the rooms a given user may see.
 *
 * @param rooms        Full list of chat rooms from DB
 * @param role         User's role (l3 | l4 | l5 | alumni | admin | trainer)
 * @param trainerTiers Tiers of the trainer's assigned modules (only used when role === "trainer")
 */
export function getAccessibleRooms(
  rooms: RoomRow[],
  role: string,
  trainerTiers: string[] = []
): RoomRow[] {
  return rooms.filter((room) => {
    // General rooms — everyone
    if (!room.tierVisibility) return true;

    const tv = room.tierVisibility;

    switch (role) {
      case "admin":
        // Admin sees everything
        return true;

      case "alumni":
        return STUDENT_TIER_MAP.alumni.includes(tv);

      case "l5":
      case "l4":
      case "l3":
        // Student sees only General (already handled above) + their own tier room
        return tv === role;

      case "trainer":
        // Trainer sees tier rooms whose level matches their assigned module tiers
        // Admin room is never visible to trainers
        if (tv === "admin" || tv === "alumni") return false;
        return trainerTiers.includes(tv);

      default:
        return false;
    }
  });
}

/**
 * Returns true if the given user may enter a specific room.
 */
export function canAccessRoom(
  room: RoomRow,
  role: string,
  trainerTiers: string[] = []
): boolean {
  return getAccessibleRooms([room], role, trainerTiers).length > 0;
}
