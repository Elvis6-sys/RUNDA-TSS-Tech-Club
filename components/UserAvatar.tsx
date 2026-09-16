"use client";

import Image from "next/image";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const SIZE_CLASS: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

// Deterministic colour from name so each user has a unique avatar colour
function colorFromName(name: string) {
  const COLORS = [
    "bg-sky-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  name?: string | null;
  profileImage?: string | null;
  size?: Size;
  className?: string;
  /** If true, a subtle ring is shown around the avatar */
  ring?: boolean;
}

export default function UserAvatar({
  name,
  profileImage,
  size = "md",
  className = "",
  ring = false,
}: Props) {
  const px = SIZE_PX[size];
  const cls = SIZE_CLASS[size];
  const ringCls = ring ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900" : "";

  if (profileImage) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden ${cls} ${ringCls} ${className}`}
        style={{ minWidth: px, minHeight: px }}
      >
        <Image
          src={profileImage}
          alt={name ?? "User avatar"}
          fill
          sizes={`${px}px`}
          className="object-cover"
          onError={(e) => {
            // Fallback: hide broken image so the initials show through
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  const bg = colorFromName(name ?? "?");

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white select-none ${cls} ${bg} ${ringCls} ${className}`}
      style={{ minWidth: px, minHeight: px }}
      aria-label={name ?? "User avatar"}
    >
      {initials(name)}
    </div>
  );
}
