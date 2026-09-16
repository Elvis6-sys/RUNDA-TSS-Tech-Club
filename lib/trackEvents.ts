/**
 * trackEvents.ts
 *
 * In-process event bus for track changes.
 * When a teacher saves blocks, updates TOC, or regenerates the TOC,
 * we emit an event here. All SSE connections listening to this track
 * receive it and push a message to the student's browser immediately.
 *
 * Works in Next.js dev and production (single-process).
 * For multi-process deployments (e.g. multiple Vercel instances) you would
 * replace this with Redis pub/sub — but for a single-server setup this is
 * sufficient and zero-dependency.
 */

import { EventEmitter } from 'events';

// Singleton emitter stored on globalThis so it survives HMR in dev
const g = globalThis as any;
if (!g.__trackEventEmitter) {
  g.__trackEventEmitter = new EventEmitter();
  g.__trackEventEmitter.setMaxListeners(200); // support many concurrent students
}

export const trackEventEmitter: EventEmitter = g.__trackEventEmitter;

export type TrackEventType =
  | 'blocks_updated'   // teacher saved content blocks
  | 'toc_updated'      // teacher edited / regenerated TOC
  | 'entry_updated'    // teacher edited a custom TOC entry
  | 'entry_deleted';   // teacher deleted a custom TOC entry

export interface TrackEvent {
  type: TrackEventType;
  trackId: string;
  ts: number; // unix ms
}

/** Call this from any API route after a successful write */
export function emitTrackChange(trackId: string, type: TrackEventType) {
  const event: TrackEvent = { type, trackId, ts: Date.now() };
  trackEventEmitter.emit(`track:${trackId}`, event);
}
