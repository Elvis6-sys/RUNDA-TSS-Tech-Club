"use client";

import { useRef, useState, useCallback } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import UserAvatar from "./UserAvatar";

interface Props {
  currentImage?: string | null;
  name?: string | null;
  onUpdate: (newUrl: string | null) => void;
}

export default function ProfilePictureUpload({ currentImage, name, onUpdate }: Props) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  function validate(file: File): string | null {
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) return "Only JPEG, PNG, WebP or GIF images are allowed.";
    if (file.size > 5 * 1024 * 1024) return "Image must be 5 MB or less.";
    return null;
  }

  const handleFile = useCallback(async (file: File) => {
    clearMessages();
    const err = validate(file);
    if (err) { setError(err); return; }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const interval = setInterval(() => {
        setProgress(p => (p < 85 ? p + 10 : p));
      }, 120);

      const res = await fetch("/api/user/profile-picture", { method: "POST", body: formData });
      clearInterval(interval);
      setProgress(100);

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      setPreview(json.profileImage);
      onUpdate(json.profileImage);
      setSuccess("Profile picture updated!");
    } catch (e: unknown) {
      setPreview(currentImage ?? null);
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      setTimeout(() => setProgress(0), 600);
    }
  }, [currentImage, onUpdate]);

  async function handleDelete() {
    if (!preview) return;
    clearMessages();
    setDeleting(true);
    try {
      const res = await fetch("/api/user/profile-picture", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setPreview(null);
      onUpdate(null);
      setSuccess("Profile picture removed.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ── Avatar preview ────────────────────────────────────────────── */}
      <div className="relative group">
        <div
          className={`rounded-full overflow-hidden ring-4 transition-all duration-300 ${dragging
              ? "ring-sky-400 scale-105"
              : "ring-slate-700 group-hover:ring-sky-500/60"
            }`}
        >
          <UserAvatar name={name} profileImage={preview} size="xl" />
        </div>

        {/* Camera overlay on hover */}
        <button
          type="button"
          onClick={() => { clearMessages(); inputRef.current?.click(); }}
          disabled={uploading || deleting}
          className="absolute inset-0 rounded-full flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Change profile picture"
        >
          {uploading
            ? <Loader2 className="w-7 h-7 text-white animate-spin" />
            : <Camera className="w-7 h-7 text-white" />
          }
        </button>
      </div>

      {/* ── Upload progress bar ───────────────────────────────────────── */}
      {uploading && progress > 0 && (
        <div className="w-full max-w-xs h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Drag-and-drop zone ────────────────────────────────────────── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => { clearMessages(); inputRef.current?.click(); }}
        className={`w-full max-w-sm rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 px-6 py-8 text-center select-none ${dragging
            ? "border-sky-400 bg-sky-500/10 scale-[1.02]"
            : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/40"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex justify-center mb-3">
          {dragging
            ? <Upload className="w-8 h-8 text-sky-400" />
            : <ImagePlus className="w-8 h-8 text-slate-500" />
          }
        </div>
        <p className="text-sm font-semibold text-slate-300">
          {dragging ? "Drop to upload" : "Click or drag an image here"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          JPEG · PNG · WebP · GIF — max 5 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { clearMessages(); inputRef.current?.click(); }}
          disabled={uploading || deleting}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition"
        >
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Camera className="w-4 h-4" />
          }
          {uploading ? "Uploading…" : "Choose Photo"}
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50 text-sm font-semibold px-5 py-2.5 transition"
          >
            {deleting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />
            }
            {deleting ? "Removing…" : "Remove"}
          </button>
        )}
      </div>

      {/* ── Feedback messages ─────────────────────────────────────────── */}
      {error && (
        <div className="w-full max-w-sm rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="w-full max-w-sm rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
