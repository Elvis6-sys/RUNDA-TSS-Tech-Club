"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  Participant,
  Track,
  ConnectionState,
  RemoteTrackPublication,
  AudioPresets,
  TrackPublishOptions,
} from "livekit-client";

// Unlock browser autoplay by resuming the AudioContext on first user gesture.
// Must be called inside a click handler before any audio plays.
function unlockAudio() {
  // LiveKit internally uses an AudioContext; resuming it unblocks autoplay.
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AudioSessionData = {
  id: string;
  title: string;
  roomName: string;
  hostId: string;
  allowedRoles: string;
  status: string;
  host: { id: string; name: string | null; role: string };
};

type ParticipantInfo = {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
};

type RaisedHand = { identity: string; name: string; raisedAt: number };
type SpotlightState = string | null;
type SpeakingTime = Record<string, number>;
type Toast = { id: number; msg: string; kind: "info" | "warn" };

type Props = {
  currentUser: { id: string; name: string | null; role: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES = ["l3", "l4", "l5", "alumni", "admin"] as const;
const HOST_ROLES = ["admin", "alumni", "l5"];

const ROLE_LABEL: Record<string, string> = {
  l3: "L3 Students", l4: "L4 Students", l5: "L5 Students",
  alumni: "Alumni", admin: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "text-rose-400", alumni: "text-amber-400",
  l5: "text-purple-400", l4: "text-sky-400", l3: "text-emerald-400",
};

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Toast Notifications ─────────────────────────────────────────────────────

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl px-4 py-2 text-xs font-semibold shadow-lg ${
            t.kind === "warn"
              ? "bg-rose-500/90 text-white"
              : "bg-slate-700/95 text-slate-100"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Remote Audio Attachment ──────────────────────────────────────────────────
// Uses LiveKit's room.startAudio() which correctly handles browser autoplay
// policy by resuming the internal AudioContext after a user gesture.

function RemoteAudio({ room }: { room: Room }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function attach(pub: RemoteTrackPublication, participant: RemoteParticipant) {
      if (pub.kind !== Track.Kind.Audio || !pub.track) return;
      const key = `audio-${participant.identity}`;
      if (container!.querySelector(`[data-key="${key}"]`)) return;
      const el = pub.track.attach() as HTMLAudioElement;
      el.dataset.key = key;
      el.autoplay = true;
      (el as HTMLAudioElement & { playsInline: boolean }).playsInline = true;
      // Force play — resolves the promise silently if autoplay is blocked
      el.play().catch(() => {});
      container!.appendChild(el);
    }

    function detach(participant: RemoteParticipant) {
      const el = container!.querySelector(`[data-key="audio-${participant.identity}"]`);
      if (el) el.remove();
    }

    // Attach already-subscribed tracks (rejoin case)
    room.remoteParticipants.forEach((p) =>
      p.trackPublications.forEach((pub) =>
        attach(pub as RemoteTrackPublication, p)
      )
    );

    const onSub = (_: unknown, pub: RemoteTrackPublication, p: RemoteParticipant) => attach(pub, p);
    const onUnsub = (_: unknown, __: unknown, p: RemoteParticipant) => detach(p);
    const onLeft = (p: RemoteParticipant) => detach(p);

    room.on(RoomEvent.TrackSubscribed, onSub);
    room.on(RoomEvent.TrackUnsubscribed, onUnsub);
    room.on(RoomEvent.ParticipantDisconnected, onLeft);

    return () => {
      room.off(RoomEvent.TrackSubscribed, onSub);
      room.off(RoomEvent.TrackUnsubscribed, onUnsub);
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
      container.innerHTML = "";
    };
  }, [room]);

  return <div ref={containerRef} className="hidden" aria-hidden />;
}

// ─── Participant Tile ─────────────────────────────────────────────────────────

function ParticipantTile({ p, handRaised, spotlit, speakSecs, onMute, onSpotlight }: {
  p: ParticipantInfo;
  handRaised?: boolean;
  spotlit?: boolean;
  speakSecs?: number;
  onMute?: (identity: string) => void;
  onSpotlight?: (identity: string) => void;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-all ${
      spotlit
        ? "bg-sky-500/15 ring-2 ring-sky-500/50"
        : p.isSpeaking
        ? "bg-emerald-500/15 ring-1 ring-emerald-500/40"
        : "bg-slate-800/60"
    }`}>
      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        spotlit ? "bg-sky-500/30 text-sky-200" : p.isHost ? "bg-sky-500/20 text-sky-300" : "bg-slate-700 text-slate-300"
      }`}>
        {(p.name?.[0] ?? "?").toUpperCase()}
        {p.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {p.name ?? p.identity}
          {p.isHost && <span className="ml-1.5 text-[10px] font-semibold text-sky-400 uppercase tracking-wide">Host</span>}
          {spotlit && <span className="ml-1.5 text-[10px] font-semibold text-sky-300 uppercase tracking-wide">⭐ Spotlight</span>}
        </p>
        {(speakSecs ?? 0) > 0 && (
          <p className="text-[10px] text-emerald-400 font-mono">{fmtTime(speakSecs!)}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {handRaised && <span title="Hand raised">✋</span>}
        {onSpotlight && (
          <button
            onClick={() => onSpotlight(p.identity)}
            title={spotlit ? "Remove spotlight" : "Spotlight this speaker"}
            className={`rounded-lg p-0.5 text-xs transition ${
              spotlit ? "text-sky-400 hover:text-slate-400" : "text-slate-500 hover:text-sky-400"
            }`}
          >
            ⭐
          </button>
        )}
        {onMute && !p.isHost && !p.isMuted && (
          <button
            onClick={() => onMute(p.identity)}
            title="Mute this participant"
            className="rounded-lg p-0.5 text-xs text-slate-500 hover:text-rose-400 transition"
          >
            🔇
          </button>
        )}
        <span className="text-base" title={p.isMuted ? "Muted" : "Unmuted"}>
          {p.isMuted ? "🔇" : "🎤"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AudioConference({ currentUser }: Props) {
  const isHost = HOST_ROLES.includes(currentUser.role);

  // ── Create-session form state (host only)
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // ── Active sessions visible to this user
  const [liveSessions, setLiveSessions] = useState<AudioSessionData[]>([]);

  // ── In-session state
  const [activeSession, setActiveSession] = useState<AudioSessionData | null>(null);
  const [room] = useState(() => new Room({
    adaptiveStream: false,
    dynacast: false,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
    },
    publishDefaults: {
      audioPreset: AudioPresets.musicHighQuality,
      dtx: false,
      red: true,
      forceStereo: false,
    } as TrackPublishOptions,
  }));
  const [connState, setConnState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [muted, setMuted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);

  // ── Toast notifications ───────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const pushToast = useCallback((msg: string, kind: Toast["kind"] = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, msg, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data channel: send/receive raise-hand signals ─────────────────────────

  function sendData(payload: object) {
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    room.localParticipant.publishData(encoded, { reliable: true });
  }

  function toggleHand() {
    const next = !myHandRaised;
    setMyHandRaised(next);
    sendData({ type: next ? "raise_hand" : "lower_hand", identity: currentUser.id, name: currentUser.name ?? "Member" });
  }

  function dismissHand(identity: string) {
    setRaisedHands((prev) => prev.filter((h) => h.identity !== identity));
    sendData({ type: "lower_hand", identity });
  }

  // ── Host mute controls ─────────────────────────────────────────────────

  function hostMuteOne(identity: string) {
    const target = participants.find((p) => p.identity === identity);
    sendData({ type: "mute_me", target: identity });
    pushToast(`🔇 Muted ${target?.name ?? identity}`);
  }

  function hostMuteAll() {
    sendData({ type: "mute_all", senderId: currentUser.id });
    // Mute all remote participants; host keeps their own mic
    room.remoteParticipants.forEach((rp) => {
      // The data message handles their side; nothing to do locally for remotes
    });
    pushToast("🔇 Muted all participants");
  }

  // ── Spotlight ─────────────────────────────────────────────────────────────

  const [spotlight, setSpotlight] = useState<SpotlightState>(null);

  // ── Speaking time tracker ─────────────────────────────────────────────────────

  const [speakingTime, setSpeakingTime] = useState<SpeakingTime>({});
  const speakingTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSpeakersRef = useRef<Set<string>>(new Set());

  function toggleSpotlight(identity: string) {
    const next = spotlight === identity ? null : identity;
    setSpotlight(next);
    sendData({ type: "spotlight", identity: next });
  }

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Build participant list from room ──────────────────────────────────────

  const activeSessionRef = useRef<AudioSessionData | null>(null);

  const syncParticipants = useCallback(() => {
    const sess = activeSessionRef.current;
    if (!sess) return;
    const all: ParticipantInfo[] = [];

    function fromParticipant(p: Participant): ParticipantInfo {
      const audioTrack = [...p.trackPublications.values()].find(
        (t) => t.kind === Track.Kind.Audio
      );
      return {
        identity: p.identity,
        name: p.name ?? p.identity,
        isSpeaking: p.isSpeaking,
        isMuted: audioTrack ? audioTrack.isMuted : true,
        isHost: p.identity === sess!.hostId,
      };
    }

    all.push(fromParticipant(room.localParticipant));
    room.remoteParticipants.forEach((rp) => all.push(fromParticipant(rp)));
    all.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0) || a.name.localeCompare(b.name));
    setParticipants(all);
  }, [room]);

  // ── Room event listeners ──────────────────────────────────────────────────

  useEffect(() => {
    const onStateChange = (state: ConnectionState) => {
      setConnState(state);
      if (state === ConnectionState.Disconnected) {
        activeSessionRef.current = null;
        setActiveSession(null);
        setParticipants([]);
        setRaisedHands([]);
        setMyHandRaised(false);
        setElapsedSecs(0);
        setSpotlight(null);
        setSpeakingTime({});
        activeSpeakersRef.current = new Set();
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (speakingTickRef.current) { clearInterval(speakingTickRef.current); speakingTickRef.current = null; }
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, onStateChange);
    room.on(RoomEvent.ParticipantConnected, syncParticipants);
    room.on(RoomEvent.ParticipantDisconnected, syncParticipants);
    room.on(RoomEvent.TrackMuted, syncParticipants);
    room.on(RoomEvent.TrackUnmuted, syncParticipants);
    room.on(RoomEvent.LocalTrackPublished, syncParticipants);

    // ActiveSpeakersChanged: update participant list AND track speaking time
    const onSpeakers = (speakers: Participant[]) => {
      activeSpeakersRef.current = new Set(speakers.map((s) => s.identity));
      syncParticipants();
    };
    room.on(RoomEvent.ActiveSpeakersChanged, onSpeakers);

    // Tick every second — add 1s to each currently-speaking participant
    // (started in connectToRoom, stopped in handleLeave/handleEnd/disconnect)

    // Data messages
    const onData = (raw: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(raw));
        if (msg.type === "raise_hand") {
          setRaisedHands((prev) => {
            if (prev.find((h) => h.identity === msg.identity)) return prev;
            return [...prev, { identity: msg.identity, name: msg.name, raisedAt: Date.now() }];
          });
        } else if (msg.type === "lower_hand") {
          setRaisedHands((prev) => prev.filter((h) => h.identity !== msg.identity));
          if (msg.identity === currentUser.id) setMyHandRaised(false);
        } else if (msg.type === "mute_me" && msg.target === currentUser.id) {
          room.localParticipant.setMicrophoneEnabled(false).then(() => {
            setMuted(true);
            syncParticipants();
            pushToast("🔇 You were muted by the host", "warn");
          });
        } else if (msg.type === "mute_all" && msg.senderId !== currentUser.id) {
          room.localParticipant.setMicrophoneEnabled(false).then(() => {
            setMuted(true);
            syncParticipants();
            pushToast("🔇 Host muted everyone", "warn");
          });
        } else if (msg.type === "spotlight") {
          setSpotlight(msg.identity ?? null);
        }
      } catch { /* ignore malformed */ }
    };
    room.on(RoomEvent.DataReceived, onData);

    return () => {
      room.removeAllListeners();
      if (speakingTickRef.current) { clearInterval(speakingTickRef.current); speakingTickRef.current = null; }
    };
  }, [room, syncParticipants, pushToast]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    if (activeSession) syncParticipants();
  }, [activeSession, syncParticipants]);

  // ── Poll for live sessions ────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions/active");
    if (res.ok) {
      const data = await res.json();
      setLiveSessions(data.sessions ?? []);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    pollRef.current = setInterval(fetchSessions, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchSessions]);

  // ── Create session (host) ─────────────────────────────────────────────────

  async function handleCreate() {
    if (!title.trim() || !selectedRoles.length) return;
    unlockAudio(); // must be called synchronously inside the click handler
    setCreating(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), allowedRoles: selectedRoles }),
    });
    if (!res.ok) { setCreating(false); return; }
    const { session: sess, token, livekitUrl } = await res.json();
    setShowCreate(false);
    setTitle("");
    setSelectedRoles([]);
    setCreating(false);
    await connectToRoom(sess, token, livekitUrl);
  }

  // ── Join session (member) ─────────────────────────────────────────────────

  async function handleJoin(sess: AudioSessionData) {
    unlockAudio(); // must be called synchronously inside the click handler
    setJoining(true);
    const res = await fetch(`/api/sessions/${sess.id}`, { method: "POST" });
    if (!res.ok) { setJoining(false); return; }
    const { token, livekitUrl } = await res.json();
    setJoining(false);
    await connectToRoom(sess, token, livekitUrl);
  }

  // ── Connect to LiveKit room ───────────────────────────────────────────────

  async function connectToRoom(sess: AudioSessionData, token: string, livekitUrl: string) {
    activeSessionRef.current = sess;
    setActiveSession(sess);
    // Force TURN relay so WebRTC works on networks that block UDP / port 7881.
    // LiveKit Cloud automatically provides TURN credentials via the token.
    await room.connect(livekitUrl, token, {
      // Increase timeouts for slower/restricted networks
      peerConnectionTimeout: 30000,
    });
    await room.startAudio();
    await room.localParticipant.setMicrophoneEnabled(true);
    setMuted(false);
    setElapsedSecs(0);
    timerRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    speakingTickRef.current = setInterval(() => {
      if (activeSpeakersRef.current.size === 0) return;
      setSpeakingTime((prev) => {
        const next = { ...prev };
        activeSpeakersRef.current.forEach((id) => { next[id] = (next[id] ?? 0) + 1; });
        return next;
      });
    }, 1000);
  }

  // ── Toggle mute ───────────────────────────────────────────────────────────

  async function toggleMute() {
    const currentlyEnabled = room.localParticipant.isMicrophoneEnabled;
    const next = !currentlyEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMuted(!next);
    syncParticipants();
  }

  // ── Leave / End session ───────────────────────────────────────────────────

  async function handleLeave() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (speakingTickRef.current) { clearInterval(speakingTickRef.current); speakingTickRef.current = null; }
    activeSessionRef.current = null;
    await room.disconnect();
    setActiveSession(null);
    setParticipants([]);
    setElapsedSecs(0);
    setSpotlight(null);
    setSpeakingTime({});
    fetchSessions();
  }

  async function handleEnd() {
    if (!activeSession) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (speakingTickRef.current) { clearInterval(speakingTickRef.current); speakingTickRef.current = null; }
    activeSessionRef.current = null;
    await fetch(`/api/sessions/${activeSession.id}`, { method: "PATCH" });
    await room.disconnect();
    setActiveSession(null);
    setParticipants([]);
    setElapsedSecs(0);
    setSpotlight(null);
    setSpeakingTime({});
    fetchSessions();
  }

  // ── Render: in-session panel ──────────────────────────────────────────────

  if (activeSession && connState !== ConnectionState.Disconnected) {
    const amHost = activeSession.hostId === currentUser.id;
    const isConnecting = connState === ConnectionState.Connecting || connState === ConnectionState.Reconnecting;

    return (
      <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3">
        <ToastStack toasts={toasts} />
        {/* Hidden audio elements for remote participants */}
        <RemoteAudio room={room} />
        {/* Session header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white truncate max-w-[180px]">{activeSession.title}</span>
            {isConnecting && <span className="text-xs text-slate-400">Connecting…</span>}
            {!isConnecting && (
              <>
                <span className="font-mono text-xs text-emerald-400">{fmtTime(elapsedSecs)}</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  👥 {participants.length}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                muted
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              {muted ? "🔇 Unmute" : "🎤 Mute"}
            </button>
            {amHost && (
              <button
                onClick={hostMuteAll}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                title="Mute all participants"
              >
                🔇 Mute all
              </button>
            )}
            {amHost ? (
              <button
                onClick={handleEnd}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/30 transition"
              >
                ⏹ End session
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                ↩ Leave
              </button>
            )}
          </div>
        </div>

        {/* Allowed roles badge */}
        <p className="mb-2 text-[10px] text-slate-500 uppercase tracking-wide">
          {activeSession.allowedRoles === "all"
            ? "Open to all members"
            : `Audience: ${activeSession.allowedRoles.split(",").map((r) => ROLE_LABEL[r] ?? r).join(", ")}`}
        </p>

        {/* Raise hand — members only */}
        {!amHost && (
          <button
            onClick={toggleHand}
            className={`mb-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
              myHandRaised
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            ✋ {myHandRaised ? "Lower hand" : "Raise hand"}
          </button>
        )}

        {/* Raised hands queue — host only */}
        {amHost && raisedHands.length > 0 && (
          <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">✋ Raised hands ({raisedHands.length})</p>
            {raisedHands.map((h) => (
              <div key={h.identity} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-200">{h.name}</span>
                <button
                  onClick={() => dismissHand(h.identity)}
                  className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Participant grid — spotlighted participant always first */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {[...participants]
            .sort((a, b) => (b.identity === spotlight ? 1 : 0) - (a.identity === spotlight ? 1 : 0))
            .map((p) => (
              <ParticipantTile
                key={p.identity}
                p={p}
                handRaised={raisedHands.some((h) => h.identity === p.identity)}
                spotlit={spotlight === p.identity}
                speakSecs={speakingTime[p.identity] ?? 0}
                onMute={amHost ? hostMuteOne : undefined}
                onSpotlight={amHost ? toggleSpotlight : undefined}
              />
            ))}
        </div>
      </div>
    );
  }

  // ── Render: idle / lobby ──────────────────────────────────────────────────

  return (
    <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-2.5 space-y-2">
      {/* Live session banners for this user */}
      {liveSessions.map((sess) => {
        const amHost = sess.hostId === currentUser.id;
        const eligible =
          amHost ||
          sess.allowedRoles === "all" ||
          sess.allowedRoles.split(",").includes(currentUser.role);

        return (
          <div
            key={sess.id}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 ${
              eligible
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-slate-700 bg-slate-800/40 opacity-60"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm font-semibold text-white truncate">{sess.title}</p>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Hosted by{" "}
                <span className={ROLE_COLOR[sess.host.role] ?? "text-slate-300"}>
                  {sess.host.name ?? "Host"}
                </span>
                {" · "}
                {sess.allowedRoles === "all"
                  ? "All members"
                  : sess.allowedRoles.split(",").map((r) => ROLE_LABEL[r] ?? r).join(", ")}
              </p>
              {!eligible && (
                <p className="mt-0.5 text-[10px] text-slate-500">
                  🔒 Not open to {ROLE_LABEL[currentUser.role] ?? currentUser.role}
                </p>
              )}
            </div>
            {eligible ? (
              <button
                onClick={() => handleJoin(sess)}
                disabled={joining}
                className="shrink-0 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
              >
                {amHost ? "Rejoin" : joining ? "Joining…" : "Join"}
              </button>
            ) : (
              <span className="shrink-0 rounded-xl border border-slate-700 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                🔒 Locked
              </span>
            )}
          </div>
        );
      })}

      {/* Host: start session button / form */}
      {isHost && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition"
        >
          🎙️ Start audio session
        </button>
      )}

      {isHost && showCreate && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">New audio session</p>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title (e.g. L4 Python Workshop)"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />

          {/* Role checkboxes */}
          <div>
            <p className="mb-1.5 text-xs text-slate-400">Who can join?</p>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(e) =>
                      setSelectedRoles((prev) =>
                        e.target.checked ? [...prev, role] : prev.filter((r) => r !== role)
                      )
                    }
                    className="accent-sky-500 h-3.5 w-3.5"
                  />
                  <span className={`text-xs font-medium ${ROLE_COLOR[role] ?? "text-slate-300"}`}>
                    {ROLE_LABEL[role]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim() || !selectedRoles.length}
              className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-40 transition"
            >
              {creating ? "Starting…" : "Start session"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setTitle(""); setSelectedRoles([]); }}
              className="rounded-xl border border-slate-600 px-4 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
