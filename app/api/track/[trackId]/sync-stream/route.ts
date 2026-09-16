/**
 * GET /api/track/[trackId]/sync-stream
 *
 * Server-Sent Events endpoint. Students connect here and receive a push
 * message the instant a teacher saves anything on this track (blocks,
 * TOC entry changes, TOC regeneration).
 *
 * The student browser then calls router.refresh() to re-run the server
 * component and pull fresh data — no full page reload needed.
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from "@/lib/local-auth";
import { trackEventEmitter, TrackEvent } from '@/lib/trackEvents';

export const dynamic = 'force-dynamic'; // never cache this route
export const runtime = 'nodejs';        // need Node EventEmitter

export async function GET(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  // Auth check — only logged-in users can subscribe
  // Local auth
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { trackId } = params;
  const eventName = `track:${trackId}`;

  // Build a ReadableStream that stays open and writes SSE messages
  const stream = new ReadableStream({
    start(controller) {
      // Send an initial "connected" heartbeat so the client knows the stream is alive
      const heartbeat = `data: ${JSON.stringify({ type: 'connected', trackId, ts: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(heartbeat));

      // Listen for track change events
      const onEvent = (event: TrackEvent) => {
        try {
          const msg = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(msg));
        } catch {
          // Stream closed — clean up
          trackEventEmitter.off(eventName, onEvent);
        }
      };

      trackEventEmitter.on(eventName, onEvent);

      // Keep-alive ping every 25 seconds to prevent proxy timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
          trackEventEmitter.off(eventName, onEvent);
        }
      }, 25_000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        trackEventEmitter.off(eventName, onEvent);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
