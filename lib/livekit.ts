import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;

export function createLiveKitToken(
  roomName: string,
  participantName: string,
  participantId: string,
  canPublish: boolean
) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: participantId,
    name: participantName,
    ttl: "4h",
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });
  return at.toJwt();
}
