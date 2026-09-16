"use client";

import { useState } from "react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import UserAvatar from "@/components/UserAvatar";
import SyncStatusPanel from "@/components/SyncStatusPanel";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  school: string | null;
  cohort: string | null;
  level: string | null;
  role: string;
  xp: number;
  profileImage: string | null;
  createdAt: Date;
};

const ROLE_LABEL: Record<string, string> = {
  l3: "Level 3 Student",
  l4: "Level 4 Student",
  l5: "Level 5 Student",
  alumni: "Alumni",
  trainer: "Trainer",
  admin: "Administrator",
  pending: "Pending Approval",
};

const ROLE_COLOR: Record<string, string> = {
  l3: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  l4: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  l5: "text-violet-400 border-violet-500/40 bg-violet-500/10",
  alumni: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  trainer: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  admin: "text-red-400 border-red-500/40 bg-red-500/10",
  pending: "text-slate-400 border-slate-500/40 bg-slate-500/10",
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <span className="text-sm text-slate-200">{value || <span className="text-slate-600 italic">Not set</span>}</span>
    </div>
  );
}

export default function ProfileClient({ profile }: { profile: Profile }) {
  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);

  const joined = new Date(profile.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-black text-white">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account details and profile picture.</p>
        </div>

        {/* ── Profile Picture Card ────────────────────────────────────────── */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
            Profile Picture
          </h2>
          <ProfilePictureUpload
            currentImage={profileImage}
            name={profile.name}
            onUpdate={(url) => setProfileImage(url)}
          />
        </section>

        {/* ── Account Info Card ───────────────────────────────────────────── */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar name={profile.name} profileImage={profileImage} size="lg" ring />
            <div>
              <p className="text-lg font-extrabold text-white">{profile.name ?? "—"}</p>
              <p className="text-sm text-slate-400">{profile.email}</p>
              <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${ROLE_COLOR[profile.role] ?? ROLE_COLOR.pending}`}>
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
          </div>

          <hr className="border-slate-800" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Full Name" value={profile.name} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="School" value={profile.school} />
            <InfoRow label="Cohort" value={profile.cohort} />
            <InfoRow label="Level" value={profile.level} />
            <InfoRow label="Joined" value={joined} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">XP Earned</span>
              <span className="text-sm text-amber-400 font-bold">⭐ {profile.xp.toLocaleString()} XP</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-xs text-slate-500">
            💡 To update your name, phone, or school details, please contact an admin or trainer.
          </div>
        </section>

        {/* ── Offline Sync Status Card (Admins Only - Tauri Desktop App) ─────────── */}
        {profile.role === 'admin' && (
          <section className="rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
              Offline Sync (Admin)
            </h2>
            <SyncStatusPanel />
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-xs text-slate-500">
              💡 This section only appears for administrators when using the RUNDA Desktop App. It shows offline sync status and allows manual synchronization.
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
