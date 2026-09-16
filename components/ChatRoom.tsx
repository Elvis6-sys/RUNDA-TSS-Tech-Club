"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send, Paperclip, Mic, MessageSquare, Wrench, Lock,
  FileText, Hash, Users, X, GraduationCap, Loader2,
  MoreVertical, Search, Smile, CheckCheck, FileArchive, File as FileIcon
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import Link from "next/link";
import dynamic from "next/dynamic";
import { format, isToday, isYesterday } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useDropzone } from "react-dropzone";

import emojiData from "@emoji-mart/data";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });
const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

type Reaction = { id: string; emoji: string; user: { id: string; name: string | null } };
type ReplyPreview = { id: string; content: string; fileName: string | null; sender: { id: string; name: string | null } };

type Message = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  replyToId: string | null;
  replyTo: ReplyPreview | null;
  createdAt: string;
  sender: { id: string; name: string | null; role: string; profileImage?: string | null };
  reactions: Reaction[];
};

type Room = {
  id: string;
  name: string;
  type?: string;
  tierVisibility?: string | null;
};

type Props = {
  room: { id: string; name: string };
  allRooms?: Room[];
  initialMessages: Message[];
  currentUser: { id: string; name: string | null; role: string };
};

// ─── WhatsApp Color Theme ──────────────────────────────────────────────────────

const WA_COLORS = {
  primary: "#25D366", // WhatsApp green
  primaryDark: "#128C7E",
  primaryLight: "#DCF8C6",
  incoming: "#1F2937", // Dark gray for incoming messages
  outgoing: "#075E54", // Dark teal for outgoing messages
  background: "#0B141A", // Very dark background
  tilePattern: "#0D1418", // Slightly lighter for pattern
};

// ─── Role Styling Config ──────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; text: string; bg: string; badge: string; avatar: string }> = {
  admin: {
    label: "Admin",
    text: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    avatar: "from-rose-500 to-pink-600",
  },
  alumni: {
    label: "Alumni",
    text: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    avatar: "from-amber-400 to-orange-500",
  },
  l5: {
    label: "Level 5",
    text: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    avatar: "from-purple-500 to-indigo-600",
  },
  l4: {
    label: "Level 4",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    avatar: "from-emerald-400 to-teal-600",
  },
  l3: {
    label: "Level 3",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    avatar: "from-emerald-400 to-teal-600",
  },
  trainer: {
    label: "Trainer",
    text: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    avatar: "from-blue-500 to-cyan-600",
  },
};

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function isImage(type: string | null) { return type?.startsWith("image/") ?? false; }
function isPdf(type: string | null) { return type === "application/pdf" || type?.includes("pdf") || false; }
function isAudio(type: string | null) { return type?.startsWith("audio/") ?? false; }
function isVideo(type: string | null) { return type?.startsWith("video/") ?? false; }
function isZip(type: string | null) {
  return type?.includes("zip") || type?.includes("compressed") || type?.includes("x-rar") || false;
}
function isMarkdown(type: string | null, name: string | null) {
  return type?.includes("markdown") ||
    name?.endsWith(".md") ||
    name?.endsWith(".markdown") ||
    false;
}
function isWord(type: string | null, name: string | null) {
  return type?.includes("word") ||
    type?.includes("document") ||
    name?.endsWith(".doc") ||
    name?.endsWith(".docx") ||
    false;
}
function isExcel(type: string | null, name: string | null) {
  return type?.includes("spreadsheet") ||
    type?.includes("excel") ||
    name?.endsWith(".xls") ||
    name?.endsWith(".xlsx") ||
    false;
}
function isPowerPoint(type: string | null, name: string | null) {
  return type?.includes("presentation") ||
    type?.includes("powerpoint") ||
    name?.endsWith(".ppt") ||
    name?.endsWith(".pptx") ||
    false;
}

function getFileIcon(type: string | null, name: string | null) {
  if (isImage(type)) return "🖼️";
  if (isPdf(type)) return "📄";
  if (isAudio(type)) return "🎵";
  if (isVideo(type)) return "🎥";
  if (isZip(type)) return "📦";
  if (isMarkdown(type, name)) return "📝";
  if (isWord(type, name)) return "📝";
  if (isExcel(type, name)) return "📊";
  if (isPowerPoint(type, name)) return "📽️";
  return "📎";
}

function fmtSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function groupReactions(reactions: Reaction[], currentUserId: string) {
  const map: Record<string, { count: number; users: string[]; hasMe: boolean }> = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [], hasMe: false };
    map[r.emoji].count++;
    map[r.emoji].users.push(r.user.name ?? "Member");
    if (r.user.id === currentUserId) map[r.emoji].hasMe = true;
  }
  return map;
}

// ─── Audio Message Bubble Player (WhatsApp Style) ────────────────────────────

function AudioPlayer({ url, isMe, knownDuration, fileType }: { url: string; isMe: boolean; knownDuration?: number; fileType?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(knownDuration ?? null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.src !== url) {
      a.src = url;
      a.load();
    }
  }, [url]);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        const handler = async () => {
          try { await a.play(); setPlaying(true); } catch { /* silent */ }
          a.removeEventListener("canplay", handler);
        };
        a.addEventListener("canplay", handler);
      }
    }
  }

  function captureDuration(e: React.SyntheticEvent<HTMLAudioElement>) {
    const d = e.currentTarget.duration;
    if (isFinite(d) && d > 0) setDuration(d);
  }

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;
  const timeLabel = `${fmtSeconds(currentTime)} / ${duration ? fmtSeconds(duration) : "--:--"}`;

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 min-w-[220px] ${isMe
      ? "bg-[#005C4B]"
      : "bg-[#1F2937]"
      }`}>
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={(e) => { setCurrentTime(e.currentTarget.currentTime); captureDuration(e); }}
        onLoadedMetadata={captureDuration}
        onDurationChange={captureDuration}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        onError={(e) => {
          const err = (e.currentTarget as HTMLAudioElement).error;
          console.error("AudioPlayer error:", err?.code, err?.message);
          setPlaying(false);
        }}
      />
      <button
        onClick={toggle}
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] text-white hover:bg-[#20BA5A] transition shadow-lg"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1 space-y-1">
        <div
          className="h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 bg-[#25D366]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-[10px] font-mono text-white/70">{timeLabel}</p>
      </div>
      <Mic className="w-4 h-4 text-white/60" />
    </div>
  );
}

// ─── Voice Recorder (WhatsApp Style) ──────────────────────────────────────────

function VoiceRecorder({ onSend, disabled }: { onSend: (blob: Blob, durationSecs: number) => Promise<void>; disabled: boolean }) {
  const [state, setState] = useState<"idle" | "recording" | "preview">("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const recordedSecondsRef = useRef(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function drawWave() {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "#25D366";
    ctx.lineWidth = 2;
    const sliceW = canvas.width / buf.length;
    let x = 0;
    for (let i = 0; i < buf.length; i++) {
      const y = (buf[i] / 128) * (canvas.height / 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.stroke();
    animRef.current = requestAnimationFrame(drawWave);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mr.mimeType });
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        setState("preview");
        recordedSecondsRef.current = seconds;
        stream.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close().catch(() => { });
        audioCtxRef.current = null;
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
      mr.start(100);
      mediaRef.current = mr;
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      drawWave();
    } catch {
      alert("Microphone access denied.");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function discard() {
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
    setSeconds(0);
  }

  async function send() {
    if (!blob) return;
    setSending(true);
    await onSend(blob, recordedSecondsRef.current);
    setSending(false);
    discard();
  }

  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => { });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="rounded-full p-2 text-gray-400 hover:text-[#25D366] transition disabled:opacity-40"
        title="Record voice message"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <canvas ref={canvasRef} width={80} height={24} className="rounded" />
        <span className="text-xs font-mono text-red-400 font-semibold">{fmtSeconds(seconds)}</span>
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600 transition"
        >
          Stop
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-[#1F2937] border border-gray-700 px-3 py-1.5">
      {previewUrl && (
        <audio
          controls
          src={previewUrl}
          className="h-7 max-w-[150px]"
          style={{ colorScheme: "dark" }}
        />
      )}
      <span className="text-xs font-mono text-gray-300">{fmtSeconds(seconds)}</span>
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white hover:bg-[#20BA5A] disabled:opacity-50 transition"
      >
        {sending ? "Sending..." : "Send"}
      </button>
      <button
        type="button"
        onClick={discard}
        className="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-400 hover:text-white transition"
      >
        ✕
      </button>
    </div>
  );
}

// ─── File Preview Modal (All File Types) ──────────────────────────────────────

function FilePreviewModal({ url, type, name, open, onClose }: { url: string; type: string | null; name: string | null; open: boolean; onClose: () => void }) {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [zipFiles, setZipFiles] = useState<string[]>([]);

  // Better file type detection: check extension if type is null
  const detectedType = type || (() => {
    if (!name) return null;
    const ext = name.split('.').pop()?.toLowerCase();
    if (!ext) return null;

    // Map extensions to MIME types
    const typeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      md: 'text/markdown',
      markdown: 'text/markdown',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
    };

    return typeMap[ext] || null;
  })();

  // Determine display type name
  const displayType = detectedType || (name ? `${name.split('.').pop()?.toUpperCase()} File` : "File");

  // Load markdown content
  useEffect(() => {
    if (isMarkdown(detectedType, name) && url) {
      fetch(url)
        .then((res) => res.text())
        .then((text) => setMarkdownContent(text))
        .catch(() => setMarkdownContent("Failed to load markdown file."));
    }
  }, [url, detectedType, name]);

  // Simulate zip file listing (you'd need a zip library for real extraction)
  useEffect(() => {
    if (isZip(detectedType) && name) {
      // Mock file list - in real app you'd extract zip contents
      setZipFiles(["📄 document.pdf", "🖼️ image.jpg", "📝 readme.txt"]);
    }
  }, [detectedType, name]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
        <Dialog.Content className="fixed inset-4 z-50 mx-auto max-w-6xl flex flex-col rounded-2xl border border-gray-700 bg-[#111B21] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#202C33] border-b border-gray-800 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl">{getFileIcon(detectedType, name)}</span>
              <div className="min-w-0">
                <Dialog.Title className="text-sm font-bold text-white truncate">{name ?? "Preview"}</Dialog.Title>
                <p className="text-xs text-gray-400">{displayType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={url}
                download={name ?? true}
                className="px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BA5A] transition flex items-center gap-2"
              >
                <span>⬇</span> Download
              </a>
              <Dialog.Close className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#0B141A]">
            {isImage(detectedType) ? (
              // Image Preview
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={name ?? "image"}
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : isPdf(detectedType) || name?.endsWith(".pdf") ? (
              // PDF Preview using PDFViewer component
              <div className="w-full h-full min-h-[80vh] flex flex-col">
                <div className="bg-[#202C33] px-4 py-2 rounded-t-xl border border-gray-800 border-b-0">
                  <p className="text-xs text-gray-400">
                    📄 PDF Document Viewer
                  </p>
                </div>
                <div className="w-full flex-1 min-h-[75vh] rounded-b-xl border border-gray-800 bg-[#1a2129] p-4 overflow-auto">
                  <PDFViewer
                    pdfUrl={url}
                    documentId="chat-pdf"
                    documentTitle="Shared PDF"
                  />
                </div>
              </div>
            ) : isVideo(detectedType) ? (
              // Video Preview
              <video
                src={url}
                controls
                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
              >
                Your browser does not support video playback.
              </video>
            ) : isMarkdown(detectedType, name) ? (
              // Markdown Preview
              <div className="w-full h-full min-h-[80vh] flex flex-col">
                <div className="bg-[#202C33] px-4 py-2 rounded-t-xl border border-gray-800 border-b-0">
                  <p className="text-xs text-gray-400">
                    📝 Markdown Document
                  </p>
                </div>
                <div className="w-full flex-1 min-h-[75vh] rounded-b-xl border border-gray-800 bg-white p-8 overflow-auto">
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: markdownContent
                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                        .replace(/\*(.*)\*/gim, '<em>$1</em>')
                        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
                        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
                        .replace(/\n$/gim, '<br />')
                    }}
                  />
                </div>
              </div>
            ) : isWord(detectedType, name) || isExcel(detectedType, name) || isPowerPoint(detectedType, name) ? (
              // Office Documents — open with system app (works 100% offline)
              (() => {
                const isW = isWord(detectedType, name);
                const isE = isExcel(detectedType, name);
                const isPP = isPowerPoint(detectedType, name);
                const icon = isW ? "📝" : isE ? "📊" : "📽️";
                const label = isW ? "Word Document" : isE ? "Excel Spreadsheet" : "PowerPoint Presentation";
                const accent = isW
                  ? "from-blue-500/30 to-blue-700/20 border-blue-500/30"
                  : isE
                    ? "from-green-500/30 to-emerald-700/20 border-green-500/30"
                    : "from-orange-500/30 to-red-600/20 border-orange-500/30";
                const btnColor = isW
                  ? "bg-blue-600 hover:bg-blue-500"
                  : isE
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-orange-600 hover:bg-orange-500";

                // Electron: use shell.openPath on the local file
                function openInSystemApp() {
                  const absUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
                  // Try Electron shell first, fall back to window.open
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const electron = (window as any).require?.("electron");
                    if (electron?.shell) {
                      // We only have an HTTP URL here, so download first then open
                      // For now fall through to anchor download
                    }
                  } catch (_) { /* browser fallback */ }
                  window.open(absUrl, "_blank");
                }

                return (
                  <div className="w-full max-w-lg mx-auto text-center space-y-6 p-8">
                    {/* Large icon banner */}
                    <div className={`w-full rounded-2xl border bg-gradient-to-br ${accent} p-10 flex flex-col items-center gap-4`}>
                      <span className="text-8xl">{icon}</span>
                      <div>
                        <p className="text-lg font-bold text-white">{name}</p>
                        <p className="text-sm text-gray-400 mt-1">{label}</p>
                      </div>
                    </div>

                    {/* Info bar */}
                    <div className="bg-[#202C33] border border-gray-700 rounded-xl p-4 text-left space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-gray-500 w-20 shrink-0">Type</span>
                        <span className="font-medium text-white">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-gray-500 w-20 shrink-0">File</span>
                        <span className="font-medium text-white truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-2 pt-2 border-t border-gray-800">
                        <span className="text-yellow-400">💡</span>
                        <span className="text-xs">
                          {isPP
                            ? "Download and open with LibreOffice Impress, PowerPoint, or WPS Office."
                            : isE
                              ? "Download and open with LibreOffice Calc, Excel, or Google Sheets (offline)."
                              : "Download and open with LibreOffice Writer, Word, or Google Docs (offline)."}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 justify-center">
                      <a
                        href={url}
                        download={name ?? true}
                        className={`flex-1 rounded-xl ${btnColor} px-6 py-3 text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2`}
                      >
                        ⬇ Download &amp; Open
                      </a>
                      <button
                        onClick={openInSystemApp}
                        className="rounded-xl bg-[#202C33] border border-gray-700 hover:border-gray-500 px-5 py-3 text-sm font-semibold text-gray-300 hover:text-white transition"
                      >
                        🔗 Open in browser
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : isZip(detectedType) || name?.match(/\.(zip|rar|7z|tar|gz)$/i) ? (
              // ZIP Archive Preview with File List
              <div className="w-full max-w-2xl text-center space-y-6 p-8">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-[#202C33] border border-gray-700 flex items-center justify-center">
                  <FileArchive className="w-12 h-12 text-[#25D366]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-2">📦 {name}</p>
                  <p className="text-sm text-gray-400 mb-4">Compressed Archive File</p>
                </div>

                {/* Mock file listing */}
                <div className="bg-[#202C33] border border-gray-700 rounded-xl p-4 text-left">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    Archive Contents Preview
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    {zipFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#0B141A] border border-gray-800">
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Download the archive to extract and access all files
                  </p>
                </div>

                <a
                  href={url}
                  download={name ?? true}
                  className="inline-block rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20BA5A] shadow-lg transition"
                >
                  Download Archive
                </a>
              </div>
            ) : (
              // Generic File Preview - with better messaging
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-[#202C33] border border-gray-700 flex items-center justify-center">
                  <span className="text-5xl">{getFileIcon(detectedType, name)}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-2">{name ?? "File"}</p>
                  <p className="text-sm text-gray-400 mb-4">{displayType}</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    {name ? `This file type cannot be previewed in the browser. Download to view on your device.` : "Preview not available for this file type. Download to view."}
                  </p>
                </div>
                <a
                  href={url}
                  download={name ?? true}
                  className="inline-block rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20BA5A] shadow-lg transition"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Message Bubble Component (WhatsApp Style) ───────────────────────────────

function MessageBubble({
  msg, isMe, currentUserId, onReact, onReply, onPreview
}: {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onPreview: (url: string, type: string | null, name: string | null) => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const grouped = groupReactions(msg.reactions, currentUserId);
  const roleCfg = ROLE_CONFIG[msg.sender.role] ?? ROLE_CONFIG.l4;

  return (
    <div
      className={`group flex items-end gap-2 my-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      {/* Sender Avatar (only for incoming messages) */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full overflow-hidden shadow-md shrink-0 mb-0.5">
          {msg.sender.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={msg.sender.profileImage}
              alt={msg.sender.name ?? "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-tr ${roleCfg.avatar} flex items-center justify-center text-xs font-bold text-white`}>
              {getInitials(msg.sender.name)}
            </div>
          )}
        </div>
      )}

      {/* Main Bubble Content */}
      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>

        {/* Sender Name & Role Badge (For incoming messages) */}
        {!isMe && (
          <div className="flex items-center gap-2 mb-0.5 px-2">
            <span className="text-xs font-semibold text-[#25D366]">{msg.sender.name ?? "Member"}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${roleCfg.badge}`}>
              {roleCfg.label}
            </span>
          </div>
        )}

        {/* Reply context */}
        {msg.replyTo && (
          <div className={`mb-1 rounded-lg border-l-4 ${isMe ? "border-[#128C7E] bg-[#0a4a42]" : "border-[#25D366] bg-[#1a2a28]"} px-3 py-2 text-xs max-w-full`}>
            <span className="font-bold text-[#25D366]">{msg.replyTo.sender.name ?? "Member"}</span>
            <p className="truncate text-gray-300 mt-0.5">{msg.replyTo.content || msg.replyTo.fileName || <><Paperclip className="w-3 h-3 inline" /> File</>}</p>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          {/* Action buttons on left for me */}
          {isMe && showActions && (
            <ActionBar onEmoji={() => setShowEmojiPicker(!showEmojiPicker)} onReply={() => onReply(msg)} />
          )}

          {/* Actual Bubble Box with WhatsApp Tail */}
          <div className="relative">
            {/* WhatsApp-style message tail using pseudo-element */}
            <div
              className={`rounded-lg px-3 py-2 text-[15px] shadow-lg relative ${isMe
                ? "bg-[#005C4B] text-white"
                : "bg-[#1F2937] text-white"
                }`}
              style={{
                ...(isMe ? {
                  borderTopRightRadius: '2px',
                } : {
                  borderTopLeftRadius: '2px',
                })
              }}
            >
              {/* Message tail SVG */}
              <div className={`absolute top-0 ${isMe ? "-right-2" : "-left-2"}`}>
                <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                  <path
                    d={isMe
                      ? "M0 0 L12 0 L0 20 Z"
                      : "M12 0 L0 0 L12 20 Z"
                    }
                    fill={isMe ? "#005C4B" : "#1F2937"}
                  />
                </svg>
              </div>

              {/* Attachments */}
              {msg.fileUrl && (
                <div className="mb-2">
                  {isAudio(msg.fileType) ? (
                    <AudioPlayer
                      url={msg.fileUrl}
                      isMe={isMe}
                      fileType={msg.fileType}
                      knownDuration={(() => {
                        const m = msg.content?.match(/^__dur:(\d+)__$/);
                        return m ? parseInt(m[1]) : undefined;
                      })()}
                    />
                  ) : isImage(msg.fileType) ? (
                    <button onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)} className="block group/img overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName ?? "image"}
                        className="max-w-[280px] max-h-[240px] rounded-lg object-cover group-hover/img:scale-105 transition duration-300"
                      />
                    </button>
                  ) : isVideo(msg.fileType) ? (
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`relative rounded-lg overflow-hidden max-w-[280px] group`}
                    >
                      <video
                        src={msg.fileUrl}
                        className="w-full h-auto max-h-[200px] object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <span className="text-2xl">▶</span>
                        </div>
                      </div>
                    </button>
                  ) : isPdf(msg.fileType) || msg.fileName?.endsWith(".pdf") ? (
                    // Rich PDF Preview Card
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`group/pdf relative rounded-xl overflow-hidden shadow-lg transition max-w-[280px] ${isMe
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-gray-800 hover:bg-gray-750"
                        }`}
                    >
                      <div className="relative h-[200px] bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                        <div className="text-7xl">📄</div>
                        <div className="absolute inset-0 bg-black/0 group-hover/pdf:bg-black/20 transition flex items-center justify-center">
                          <div className="opacity-0 group-hover/pdf:opacity-100 transition bg-white/90 rounded-full p-3">
                            <span className="text-2xl">👁️</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2.5 ${isMe ? "bg-[#004a3f]" : "bg-gray-900"}`}>
                        <p className="truncate text-sm font-semibold text-white">{msg.fileName ?? "Document.pdf"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">📄 PDF Document • Tap to view</p>
                      </div>
                    </button>
                  ) : (isWord(msg.fileType, msg.fileName) || isExcel(msg.fileType, msg.fileName) || isPowerPoint(msg.fileType, msg.fileName)) ? (
                    // Rich Document Preview Card (Word/Excel/PowerPoint)
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`group/doc relative rounded-xl overflow-hidden shadow-lg transition max-w-[280px] ${isMe
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-gray-800 hover:bg-gray-750"
                        }`}
                    >
                      <div className={`relative h-[200px] flex items-center justify-center ${isWord(msg.fileType, msg.fileName)
                        ? "bg-gradient-to-br from-blue-500/20 to-blue-600/20"
                        : isExcel(msg.fileType, msg.fileName)
                          ? "bg-gradient-to-br from-green-500/20 to-emerald-600/20"
                          : "bg-gradient-to-br from-orange-500/20 to-red-600/20"
                        }`}>
                        <div className="text-7xl">
                          {isWord(msg.fileType, msg.fileName) ? "📝" : isExcel(msg.fileType, msg.fileName) ? "📊" : "📽️"}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover/doc:bg-black/20 transition flex items-center justify-center">
                          <div className="opacity-0 group-hover/doc:opacity-100 transition bg-white/90 rounded-full p-3">
                            <span className="text-2xl">👁️</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2.5 ${isMe ? "bg-[#004a3f]" : "bg-gray-900"}`}>
                        <p className="truncate text-sm font-semibold text-white">{msg.fileName ?? "Document"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isWord(msg.fileType, msg.fileName) ? "📝 Word Document" :
                            isExcel(msg.fileType, msg.fileName) ? "📊 Excel Spreadsheet" :
                              "📽️ PowerPoint Presentation"} • Tap to view
                        </p>
                      </div>
                    </button>
                  ) : isZip(msg.fileType) || msg.fileName?.match(/\.(zip|rar|7z|tar|gz)$/i) ? (
                    // Rich Archive Preview Card
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`group/zip relative rounded-xl overflow-hidden shadow-lg transition max-w-[280px] ${isMe
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-gray-800 hover:bg-gray-750"
                        }`}
                    >
                      <div className="relative h-[200px] bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center">
                        <div className="text-7xl">📦</div>
                        <div className="absolute inset-0 bg-black/0 group-hover/zip:bg-black/20 transition flex items-center justify-center">
                          <div className="opacity-0 group-hover/zip:opacity-100 transition bg-white/90 rounded-full p-3">
                            <span className="text-2xl">⬇</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2.5 ${isMe ? "bg-[#004a3f]" : "bg-gray-900"}`}>
                        <p className="truncate text-sm font-semibold text-white">{msg.fileName ?? "Archive.zip"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">📦 Compressed Archive • Tap to download</p>
                      </div>
                    </button>
                  ) : isMarkdown(msg.fileType, msg.fileName) ? (
                    // Rich Markdown Preview Card
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`group/md relative rounded-xl overflow-hidden shadow-lg transition max-w-[280px] ${isMe
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-gray-800 hover:bg-gray-750"
                        }`}
                    >
                      <div className="relative h-[200px] bg-gradient-to-br from-gray-500/20 to-slate-600/20 flex items-center justify-center">
                        <div className="text-7xl">📝</div>
                        <div className="absolute inset-0 bg-black/0 group-hover/md:bg-black/20 transition flex items-center justify-center">
                          <div className="opacity-0 group-hover/md:opacity-100 transition bg-white/90 rounded-full p-3">
                            <span className="text-2xl">👁️</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2.5 ${isMe ? "bg-[#004a3f]" : "bg-gray-900"}`}>
                        <p className="truncate text-sm font-semibold text-white">{msg.fileName ?? "Document.md"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">📝 Markdown Document • Tap to view</p>
                      </div>
                    </button>
                  ) : (
                    // Generic file with better detection
                    <button
                      onClick={() => onPreview(msg.fileUrl!, msg.fileType, msg.fileName)}
                      className={`group/file relative rounded-xl overflow-hidden shadow-lg transition max-w-[280px] ${isMe
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-gray-800 hover:bg-gray-750"
                        }`}
                    >
                      <div className="relative h-[200px] bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                        <div className="text-7xl">{getFileIcon(msg.fileType, msg.fileName)}</div>
                        <div className="absolute inset-0 bg-black/0 group-hover/file:bg-black/20 transition flex items-center justify-center">
                          <div className="opacity-0 group-hover/file:opacity-100 transition bg-white/90 rounded-full p-3">
                            <span className="text-2xl">👁️</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2.5 ${isMe ? "bg-[#004a3f]" : "bg-gray-900"}`}>
                        <p className="truncate text-sm font-semibold text-white">{msg.fileName ?? "File"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {msg.fileType || (msg.fileName ? msg.fileName.split('.').pop()?.toUpperCase() + " File" : "File")} • Tap to view
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Message Text */}
              {msg.content && !/^__dur:\d+__$/.test(msg.content) && (
                <p className="leading-[1.4] whitespace-pre-wrap break-words">{msg.content}</p>
              )}

              {/* Timestamp and read status */}
              <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isMe ? "text-gray-300" : "text-gray-400"}`}>
                <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                {isMe && (
                  <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
                )}
              </div>
            </div>
          </div>

          {/* Action buttons on right for others */}
          {!isMe && showActions && (
            <ActionBar onEmoji={() => setShowEmojiPicker(!showEmojiPicker)} onReply={() => onReply(msg)} />
          )}
        </div>

        {/* Emoji Reactions */}
        {Object.keys(grouped).length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}>
            {Object.entries(grouped).map(([emoji, data]) => (
              <Tooltip.Provider key={emoji} delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => onReact(msg.id, emoji)}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${data.hasMe
                        ? "bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366]"
                        : "bg-[#1F2937] border border-gray-700 text-gray-300 hover:border-gray-600"
                        }`}
                    >
                      {emoji} <span>{data.count}</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="rounded-lg bg-[#1F2937] border border-gray-700 px-3 py-1.5 text-xs text-white shadow-xl">
                    {data.users.join(", ")}
                  </Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            ))}
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className={`absolute z-30 ${isMe ? "right-0" : "left-0"}`} style={{ bottom: "100%" }}>
            <EmojiPicker
              data={emojiData}
              onEmojiSelect={(e: { native: string }) => { onReact(msg.id, e.native); setShowEmojiPicker(false); }}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}

      </div>
    </div>
  );
}

function ActionBar({ onEmoji, onReply }: { onEmoji: () => void; onReply: () => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-[#1F2937] border border-gray-700 rounded-full px-1.5 py-1 shadow-lg backdrop-blur-sm">
      <button onClick={onEmoji} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition" title="Add reaction">
        <Smile className="w-3.5 h-3.5" />
      </button>
      <button onClick={onReply} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition" title="Reply">
        ↩
      </button>
    </div>
  );
}

// ─── Sidebar Channel Link ─────────────────────────────────────────────────────

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  l3: { label: "L3", color: "bg-emerald-500/20 text-emerald-300" },
  l4: { label: "L4", color: "bg-sky-500/20 text-sky-300" },
  l5: { label: "L5", color: "bg-purple-500/20 text-purple-300" },
  alumni: { label: "Alumni", color: "bg-amber-500/20 text-amber-300" },
  admin: { label: "Admin", color: "bg-rose-500/20 text-rose-300" },
};

const ROOM_ICON: Record<string, JSX.Element> = {
  general: <Hash className="w-4 h-4" />,
  tier: <Users className="w-4 h-4" />,
  module: <FileText className="w-4 h-4" />,
  project: <Wrench className="w-4 h-4" />,
  direct: <MessageSquare className="w-4 h-4" />,
};

function ChannelLink({
  r,
  active,
  onClose,
}: {
  r: { id: string; name: string; type?: string; tierVisibility?: string | null };
  active: boolean;
  onClose: () => void;
}) {
  const icon = ROOM_ICON[r.type ?? "general"] ?? "#";
  const badge = r.tierVisibility ? TIER_BADGE[r.tierVisibility] : null;

  return (
    <Link
      href={`/chat/${r.id}`}
      onClick={onClose}
      className={`flex items-center justify-between gap-2 px-3 py-3 rounded-lg text-sm font-medium transition ${active
        ? "bg-[#2A3942] text-white"
        : "text-gray-300 hover:bg-[#2A3942]/50"
        }`}
    >
      <div className="flex items-center gap-3 truncate">
        <span className={`shrink-0 ${active ? "text-[#25D366]" : "text-gray-500"}`}>{icon}</span>
        <span className="truncate">{r.name}</span>
      </div>
      {badge && (
        <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badge.color}`}>
          {badge.label}
        </span>
      )}
    </Link>
  );
}

// ─── Main Integrated ChatRoom Component ───────────────────────────────────────

export default function ChatRoom({ room, allRooms = [], initialMessages, currentUser }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: string | null; name: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchChannel, setSearchChannel] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserSupabase();

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("chatTheme", newTheme);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime updates - OFFLINE-COMPATIBLE POLLING
  useEffect(() => {
    console.log("[ChatRoom] Setting up offline-compatible polling for room:", room.id);

    let pollInterval: NodeJS.Timeout;
    let lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

    const pollForNewMessages = async () => {
      try {
        // Fetch messages newer than last known message
        const url = lastMessageId
          ? `/api/chat/messages?roomId=${room.id}&since=${lastMessageId}`
          : `/api/chat/messages?roomId=${room.id}`;

        const res = await fetch(url);
        if (!res.ok) return;

        const newMessages: Message[] = await res.json();

        if (newMessages.length > 0) {
          console.log("[ChatRoom] Polled and found", newMessages.length, "new messages");
          setMessages((prev) => {
            // Merge new messages, avoiding duplicates
            const newIds = new Set(newMessages.map(m => m.id));
            const filtered = prev.filter(m => !newIds.has(m.id));
            const combined = [...filtered, ...newMessages];
            // Update last message ID
            if (combined.length > 0) {
              lastMessageId = combined[combined.length - 1].id;
            }
            return combined;
          });
        }
      } catch (error) {
        console.error("[ChatRoom] Polling error (offline?):", error);
      }
    };

    // Poll every 2 seconds for real-time feel
    pollInterval = setInterval(pollForNewMessages, 2000);

    // Initial poll
    pollForNewMessages();

    return () => {
      console.log("[ChatRoom] Cleaning up polling interval");
      clearInterval(pollInterval);
    };
  }, [room.id]);

  // LEGACY: Keep Supabase realtime as fallback for online mode
  useEffect(() => {
    console.log("[ChatRoom] Setting up Supabase realtime subscription for room:", room.id);

    const channel = supabase
      .channel(`room:${room.id}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `roomId=eq.${room.id}`,
        },
        async (payload: any) => {
          console.log("[ChatRoom] Supabase: New message INSERT event:", payload);
          const newMessageId = (payload.new as { id: string }).id;

          // Fetch only the new message with full relations
          try {
            const res = await fetch(`/api/chat/messages/${newMessageId}`);
            if (!res.ok) {
              console.error("[ChatRoom] Failed to fetch new message:", res.status);
              return;
            }
            const newMsg: Message = await res.json();
            console.log("[ChatRoom] Fetched new message:", newMsg);

            // Add to messages if not already present
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id);
              if (exists) {
                console.log("[ChatRoom] Message already exists, skipping");
                return prev;
              }
              console.log("[ChatRoom] Adding new message to state");
              return [...prev, newMsg];
            });
          } catch (error) {
            console.error("[ChatRoom] Error fetching new message:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "MessageReaction" },
        async () => {
          console.log("[ChatRoom] New reaction INSERT event");
          // Refresh messages to get updated reactions
          const res = await fetch(`/api/chat/messages?roomId=${room.id}`);
          if (res.ok) setMessages(await res.json());
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "MessageReaction" },
        async () => {
          console.log("[ChatRoom] Reaction DELETE event");
          // Refresh messages to get updated reactions
          const res = await fetch(`/api/chat/messages?roomId=${room.id}`);
          if (res.ok) setMessages(await res.json());
        }
      )
      .subscribe((status: any) => {
        console.log("[ChatRoom] Subscription status:", status);
      });

    return () => {
      console.log("[ChatRoom] Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  // Load older messages
  async function loadMore() {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    const oldest = messages[0].createdAt;
    const res = await fetch(`/api/chat/messages?roomId=${room.id}&cursor=${oldest}`);
    if (res.ok) {
      const older: Message[] = await res.json();
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
    }
    setLoadingMore(false);
  }

  // Voice message upload
  async function handleVoiceSend(blob: Blob, durationSecs: number) {
    const ext = blob.type.includes("webm") ? "webm" : "ogg";
    const cleanType = ext === "webm" ? "audio/webm" : "audio/ogg";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: cleanType });
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "chat-files");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) return;
    const { url, type, name } = await res.json();
    await sendMessage(`__dur:${Math.round(durationSecs)}__`, url, type, name);
  }

  // ── File size limits by type ───────────────────────────────────────────────
  const FILE_SIZE_LIMITS: { test: (f: File) => boolean; limit: number; label: string }[] = [
    { test: (f) => f.type.startsWith("video/"), limit: 100 * 1024 * 1024, label: "100 MB" },
    { test: (f) => f.type.startsWith("image/"), limit: 10 * 1024 * 1024, label: "10 MB" },
    { test: (f) => f.type.startsWith("audio/"), limit: 25 * 1024 * 1024, label: "25 MB" },
    { test: (f) => f.type.includes("pdf"), limit: 50 * 1024 * 1024, label: "50 MB" },
    { test: () => true /* everything else */, limit: 25 * 1024 * 1024, label: "25 MB" },
  ];

  function checkFileSize(file: File): { ok: boolean; limitLabel: string } {
    const rule = FILE_SIZE_LIMITS.find((r) => r.test(file))!;
    return { ok: file.size <= rule.limit, limitLabel: rule.label };
  }

  function fmtBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // File upload via dropzone
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Client-side size check with clear error
    const { ok, limitLabel } = checkFileSize(file);
    if (!ok) {
      alert(
        `⚠️ File too large\n\n` +
        `"${file.name}" is ${fmtBytes(file.size)}.\n` +
        `The limit for this file type is ${limitLabel}.\n\n` +
        `Please compress or trim the file before uploading.`
      );
      return;
    }

    setUploadingFile(true);
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "chat-files");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploadingFile(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Upload failed: ${err.error ?? "Unknown error"}`);
      return;
    }
    // Upload API returns { url, name, type } — map to the names sendMessage expects
    const data = await res.json();
    await sendMessage("", data.url, data.type, data.name);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop, noClick: true, noKeyboard: true
  });

  async function sendMessage(content: string, fileUrl?: string, fileType?: string, fileName?: string) {
    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      content: content ?? "",
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      fileName: fileName ?? null,
      replyToId: replyTo?.id ?? null,
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, fileName: replyTo.fileName, sender: replyTo.sender } : null,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      reactions: []
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimistic]);
    setReplyTo(null);
    setInput("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, content, fileUrl, fileType, fileName, replyToId: replyTo?.id })
      });

      setSending(false);

      if (res.ok) {
        const saved: Message = await res.json();
        // Replace optimistic message with real one
        setMessages((prev) => prev.map((m) => m.id === optimisticId ? saved : m));

        // The realtime subscription will also try to add this message
        // but our check in the subscription prevents duplicates
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        console.error("Failed to send message:", await res.text());
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      setSending(false);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error("Error sending message:", error);
      alert("Failed to send message. Please check your connection.");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    await sendMessage(content);
  }

  async function handleReact(messageId: string, emoji: string) {
    await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji })
    });
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji && r.user.id === currentUser.id);
      if (existing) {
        return { ...m, reactions: m.reactions.filter((r) => r.id !== existing.id) };
      }
      return { ...m, reactions: [...m.reactions, { id: `opt-${Date.now()}`, emoji, user: { id: currentUser.id, name: currentUser.name } }] };
    }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  // Filter channels
  const filteredChannels = allRooms.filter((r) =>
    r.name.toLowerCase().includes(searchChannel.toLowerCase())
  );

  // Theme colors
  const themeColors = theme === "dark" ? {
    background: "#0B141A",
    sidebarBg: "#111B21",
    headerBg: "#202C33",
    messageBg: "#1F2937",
    myMessageBg: "#005C4B",
    inputBg: "#2A3942",
    borderColor: "border-gray-800",
    textPrimary: "text-white",
    textSecondary: "text-gray-300",
    textMuted: "text-gray-400",
    hoverBg: "hover:bg-gray-800",
    chatBgImage: "/chat-bg.jpg",
  } : {
    background: "#E7F3F8",
    sidebarBg: "#FFFFFF",
    headerBg: "#F0F2F5",
    messageBg: "#FFFFFF",
    myMessageBg: "#DCF8C6",
    inputBg: "#FFFFFF",
    borderColor: "border-gray-200",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-700",
    textMuted: "text-gray-500",
    hoverBg: "hover:bg-gray-100",
    chatBgImage: "/chat-bg-light.jpg",
  };

  // Group messages by day
  const grouped: { day: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.messages.push(msg);
    else grouped.push({ day, messages: [msg] });
  }

  const currentUserRoleCfg = ROLE_CONFIG[currentUser.role] ?? ROLE_CONFIG.l4;

  return (
    <Tooltip.Provider>
      <div className="flex h-[calc(100vh-56px)] text-white overflow-hidden" style={{ backgroundColor: themeColors.background }}>

        {/* ── LEFT SIDEBAR (Channels Navigator) - WhatsApp Style ── */}
        <aside
          className={`fixed inset-y-14 left-0 z-20 w-80 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            }`}
          style={{
            backgroundColor: themeColors.sidebarBg,
            borderRight: `1px solid ${theme === "dark" ? "#374151" : "#E5E7EB"}`
          }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b" style={{
            backgroundColor: themeColors.headerBg,
            borderColor: theme === "dark" ? "#374151" : "#E5E7EB"
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`font-bold text-lg ${themeColors.textPrimary} flex items-center gap-2`}>
                <MessageSquare className="w-5 h-5 text-[#25D366]" /> Channels
              </h2>
              <span className="text-xs bg-[#25D366] text-black px-2 py-1 rounded-full font-bold">
                {allRooms.length}
              </span>
            </div>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeColors.textMuted}`} />
              <input
                type="text"
                value={searchChannel}
                onChange={(e) => setSearchChannel(e.target.value)}
                placeholder="Search channels..."
                className={`w-full rounded-lg border-none pl-10 pr-3 py-2 text-sm ${themeColors.textPrimary} ${themeColors.textMuted} outline-none`}
                style={{ backgroundColor: themeColors.inputBg }}
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            {/* General rooms */}
            {filteredChannels.filter((r) => !r.tierVisibility).length > 0 && (
              <div className="space-y-0.5">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                  🌐 General
                </p>
                {filteredChannels
                  .filter((r) => !r.tierVisibility)
                  .map((r) => <ChannelLink key={r.id} r={r} active={r.id === room.id} onClose={() => setSidebarOpen(false)} />)}
              </div>
            )}

            {/* Tier-specific rooms */}
            {filteredChannels.filter((r) => r.tierVisibility && r.tierVisibility !== "admin").length > 0 && (
              <div className="space-y-0.5">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                  <GraduationCap className="w-4 h-4 inline" /> Level Rooms
                </p>
                {filteredChannels
                  .filter((r) => r.tierVisibility && r.tierVisibility !== "admin")
                  .map((r) => <ChannelLink key={r.id} r={r} active={r.id === room.id} onClose={() => setSidebarOpen(false)} />)}
              </div>
            )}

            {/* Admin-only room */}
            {filteredChannels.filter((r) => r.tierVisibility === "admin").length > 0 && (
              <div className="space-y-0.5">
                <p className="px-3 py-1 text-xs font-semibold text-rose-400 uppercase">
                  <Lock className="w-4 h-4 inline" /> Admin
                </p>
                {filteredChannels
                  .filter((r) => r.tierVisibility === "admin")
                  .map((r) => <ChannelLink key={r.id} r={r} active={r.id === room.id} onClose={() => setSidebarOpen(false)} />)}
              </div>
            )}

            {filteredChannels.length === 0 && (
              <p className="px-3 py-8 text-xs text-gray-500 text-center">No channels found</p>
            )}
          </div>

          {/* Current User Card Footer */}
          <div className="p-3 border-t border-gray-800 bg-[#202C33] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${currentUserRoleCfg.avatar} flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0 relative`}>
                {getInitials(currentUser.name)}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#202C33]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                <p className={`text-xs capitalize ${currentUserRoleCfg.text}`}>{currentUserRoleCfg.label}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* ── RIGHT MAIN CHAT AREA ── */}
        <main className="flex-1 flex flex-col min-w-0 relative">

          {/* Top Channel Navigation Bar - WhatsApp Style */}
          <div className="flex items-center justify-between bg-[#202C33] px-4 py-3 border-b border-gray-800 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
              >
                ☰
              </button>

              {/* Channel Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
                #
              </div>

              <div className="min-w-0">
                <h1 className="font-semibold text-base text-white flex items-center gap-2">
                  {room.name}
                </h1>
                <p className="text-xs text-gray-400 truncate">
                  {messages.length} messages · Tech Club Student Lounge
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition">
                <Search className="w-5 h-5" />
              </button>

              <button className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Stream Area with Background Image */}
          <div
            {...getRootProps()}
            className={`chat-messages-area relative flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-4 space-y-1 custom-scrollbar ${isDragActive ? "bg-[#25D366]/5 border-2 border-dashed border-[#25D366]/40" : ""
              }`}
          >
            <input {...getInputProps()} />

            {/* Drag and drop overlay */}
            {isDragActive && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-[#25D366]/10 border-2 border-dashed border-[#25D366]/50 backdrop-blur-sm">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <Paperclip className="w-10 h-10 text-[#25D366]" />
                  </div>
                  <p className="text-[#25D366] font-bold text-lg">Drop file to send to #{room.name}</p>
                </div>
              </div>
            )}

            {/* Load older messages trigger */}
            {hasMore && (
              <div className="flex justify-center pb-3">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-[#202C33] border border-gray-800 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2A3942] transition shadow-lg disabled:opacity-50"
                >
                  {loadingMore ? (
                    <><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Loading...</>
                  ) : (
                    "↑ Load older messages"
                  )}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                <div className="w-20 h-20 rounded-full bg-[#25D366]/10 border-2 border-[#25D366]/20 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">Welcome to #{room.name}!</h3>
                  <p className="text-sm text-gray-400 max-w-md">
                    This is the start of the #{room.name} channel. Send a message, share files, or record a voice note to begin collaborating!
                  </p>
                </div>
              </div>
            )}

            {/* Messages Grouped By Day */}
            {grouped.map(({ day, messages: dayMsgs }) => (
              <div key={day} className="space-y-1">
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs font-semibold text-gray-400 px-4 py-1.5 rounded-lg bg-[#202C33] shadow-sm">
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayMsgs.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.sender.id === currentUser.id}
                      currentUserId={currentUser.id}
                      onReact={handleReact}
                      onReply={setReplyTo}
                      onPreview={(url, type, name) => setPreview({ url, type, name })}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply Context Bar - WhatsApp Style */}
          {replyTo && (
            <div className="flex items-center justify-between bg-[#1F2937] border-t border-gray-800 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-12 bg-[#25D366] rounded-full" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#25D366]">Replying to {replyTo.sender.name ?? "Member"}</p>
                  <p className="text-sm text-gray-300 truncate max-w-md mt-0.5">
                    {replyTo.content || replyTo.fileName || <><Paperclip className="w-3 h-3 inline" /> Attachment</>}
                  </p>
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── FLOATING INPUT DOCK - WhatsApp Style ── */}
          <div className="p-3 bg-[#202C33] border-t border-gray-800">
            {uploadingFile && (
              <div className="mb-2 flex items-center gap-2 text-xs text-[#25D366] font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading file attachment...</span>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2">

              {/* Emoji Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="rounded-full p-2.5 text-gray-400 hover:text-white transition"
                  title="Insert emoji"
                >
                  <Smile className="w-6 h-6" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-14 left-0 z-30">
                    <EmojiPicker
                      data={emojiData}
                      onEmojiSelect={(e: { native: string }) => {
                        setInput((p) => p + e.native);
                        setShowEmoji(false);
                        inputRef.current?.focus();
                      }}
                      theme="dark"
                      previewPosition="none"
                    />
                  </div>
                )}
              </div>

              {/* Explicit File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    await onDrop(Array.from(files));
                    e.target.value = "";
                  }
                }}
              />

              {/* File Attachment Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full p-2.5 text-gray-400 hover:text-white transition"
                title="Attach document or image"
              >
                <Paperclip className="w-6 h-6" />
              </button>

              {/* Textarea Input - WhatsApp Style */}
              <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type a message to #${room.name}`}
                  rows={1}
                  className="w-full bg-transparent py-3 px-4 text-[15px] text-white placeholder-gray-500 outline-none resize-none max-h-32"
                  style={{ minHeight: "48px" }}
                />
              </div>

              {/* Voice Recorder or Send Button */}
              {input.trim() ? (
                <button
                  type="submit"
                  disabled={(!input.trim() && !uploadingFile) || sending}
                  className="rounded-full bg-[#25D366] p-3 text-white shadow-lg hover:bg-[#20BA5A] disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <VoiceRecorder onSend={handleVoiceSend} disabled={sending || uploadingFile} />
              )}

            </form>
          </div>

          {/* File Preview Lightbox */}
          {preview && (
            <FilePreviewModal
              url={preview.url}
              type={preview.type}
              name={preview.name}
              open={!!preview}
              onClose={() => setPreview(null)}
            />
          )}

        </main>

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4B5563;
          }
        `}</style>
      </div>
    </Tooltip.Provider>
  );
}
