"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type CurriculumModule = {
  id: string;
  code: string;
  name: string;
  level: string;
  category: string;
  department: string;
};

type TrainerAssignment = {
  id: string;
  module: CurriculumModule;
};

type Trainer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  trainedModules: TrainerAssignment[];
};

export type AdminTrainerPanelProps = {
  trainers: Trainer[];
  allModules: CurriculumModule[];
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pending_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Create trainer form ──────────────────────────────────────────────────────

function CreateTrainerForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone: phone || undefined, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create trainer");
      return;
    }

    setName(""); setEmail(""); setPhone(""); setPassword("");
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
      >
        <span className="text-lg leading-none">＋</span>
        Add Trainer
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-violet-500/30 bg-violet-500/5 p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-white">New Trainer Account</h3>
      <p className="text-sm text-slate-400">
        This creates a trainer account with local authentication. The
        trainer can sign in immediately with the password you set.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <label className="block text-sm text-slate-300">
          Full name <span className="text-rose-400">*</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marie Uwera"
            className="mt-1.5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        {/* Email */}
        <label className="block text-sm text-slate-300">
          Email <span className="text-rose-400">*</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trainer@example.com"
            className="mt-1.5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        {/* Phone */}
        <label className="block text-sm text-slate-300">
          Phone <span className="text-slate-500">(optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+250 7XX XXX XXX"
            className="mt-1.5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        {/* Password */}
        <label className="block text-sm text-slate-300">
          Temporary password <span className="text-rose-400">*</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="mt-1.5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Trainer"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white hover:border-slate-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Assign module with cascading dropdowns ───────────────────────────────────

// Helper to get category display name
function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    'core': 'Core/Specific Modules',
    'general': 'General Modules',
    'ccm': 'CCM (Common Core Modules)',
  };
  return map[category] || category;
}

// Group modules by department, level, then category
function groupModules(modules: CurriculumModule[]) {
  const grouped: Record<string, Record<string, Record<string, CurriculumModule[]>>> = {};

  modules.forEach((module) => {
    const dept = module.department;
    const level = module.level;
    const category = module.category;

    if (!grouped[dept]) grouped[dept] = {};
    if (!grouped[dept][level]) grouped[dept][level] = {};
    if (!grouped[dept][level][category]) grouped[dept][level][category] = [];

    grouped[dept][level][category].push(module);
  });

  return grouped;
}

function AssignModuleRow({
  trainer,
  allModules,
  onChanged,
}: {
  trainer: Trainer;
  allModules: CurriculumModule[];
  onChanged: () => void;
}) {
  // Defensive: ensure trainedModules is an array
  const trainedModules = Array.isArray(trainer.trainedModules) ? trainer.trainedModules : [];
  const assignedIds = new Set(
    trainedModules
      .filter(m => m && m.module && m.module.id)
      .map((m) => m.module.id)
  );
  const available = allModules.filter((m) => m && m.id && !assignedIds.has(m.id));

  // Cascading dropdown states
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group available modules for cascading selection
  const groupedModules = groupModules(available);
  const departments = Object.keys(groupedModules).sort();

  // Get levels for selected department
  const levels = selectedDepartment
    ? Object.keys(groupedModules[selectedDepartment] || {}).sort()
    : [];

  // Get categories for selected department and level
  const categories = selectedDepartment && selectedLevel
    ? Object.keys(groupedModules[selectedDepartment]?.[selectedLevel] || {}).sort()
    : [];

  // Get modules for selected department, level, and category
  const modules = selectedDepartment && selectedLevel && selectedCategory
    ? (groupedModules[selectedDepartment]?.[selectedLevel]?.[selectedCategory] || []).sort((a, b) =>
      a.code.localeCompare(b.code)
    )
    : [];

  // Reset downstream selections when upstream changes
  function handleDepartmentChange(dept: string) {
    setSelectedDepartment(dept);
    setSelectedLevel("");
    setSelectedCategory("");
    setSelectedModuleId("");
  }

  function handleLevelChange(level: string) {
    setSelectedLevel(level);
    setSelectedCategory("");
    setSelectedModuleId("");
  }

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    setSelectedModuleId("");
  }

  async function assign() {
    if (!selectedModuleId) return;
    setAssigning(true);
    setError(null);

    const res = await fetch(`/api/admin/trainers/${trainer.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: selectedModuleId }),
    });

    setAssigning(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to assign");
      return;
    }

    // Reset selections after successful assignment
    setSelectedDepartment("");
    setSelectedLevel("");
    setSelectedCategory("");
    setSelectedModuleId("");
    onChanged();
  }

  async function unassign(moduleId: string) {
    const res = await fetch(`/api/admin/trainers/${trainer.id}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId }),
    });
    if (res.ok) onChanged();
  }

  return (
    <div className="space-y-3">
      {/* Current assignments */}
      {trainedModules.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {trainedModules
            .filter(m => m && m.module && m.module.id && m.module.name)
            .map((m) => (
              <span
                key={m.module.id}
                className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
              >
                <span className="font-mono text-[10px] text-violet-400/70">{m.module.code || 'N/A'}</span>
                {m.module.name}
                <button
                  onClick={() => unassign(m.module.id)}
                  title={`Unassign ${m.module.name}`}
                  className="ml-1 text-violet-400/60 hover:text-rose-400 transition"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">No modules assigned yet</p>
      )}

      {/* Cascading dropdowns */}
      {available.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Step 1: Department */}
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400"
            >
              <option value="">1. Select Department...</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Step 2: Level */}
            <select
              value={selectedLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              disabled={!selectedDepartment}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">2. Select Level...</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Step 3: Module Category */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={!selectedLevel}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">3. Select Type...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryName(cat)}
                </option>
              ))}
            </select>

            {/* Step 4: Module */}
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              disabled={!selectedCategory}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">4. Select Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assign button */}
          <button
            onClick={assign}
            disabled={assigning || !selectedModuleId}
            className="w-full rounded-xl bg-violet-500/20 border border-violet-500/30 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? "Assigning…" : "Assign Module"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// ─── Trainer row ──────────────────────────────────────────────────────────────

function TrainerRow({
  trainer,
  allModules,
  onChanged,
}: {
  trainer: Trainer;
  allModules: CurriculumModule[];
  onChanged: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Remove trainer ${trainer.name ?? trainer.email}? This cannot be undone.`)) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/trainers/${trainer.id}`, { method: "DELETE" });

    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete");
      return;
    }
    onChanged();
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-slate-100">{trainer.name ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-0.5">{trainer.email}</p>
          {trainer.phone && (
            <p className="text-xs text-slate-600 mt-0.5">{trainer.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={trainer.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>

      {/* Module assignments */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Assigned modules</p>
        <AssignModuleRow trainer={trainer} allModules={allModules} onChanged={onChanged} />
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function AdminTrainerPanel({ trainers: initial, allModules }: AdminTrainerPanelProps) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>(initial);
  const [loadingList, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trainers");
      if (res.ok) {
        const data = await res.json();
        console.log('📊 Trainers data received:', data);

        // Defensive: ensure trainers is an array and filter out invalid data
        const validTrainers = (Array.isArray(data.trainers) ? data.trainers : [])
          .filter((t: any) => t && t.id && t.email)
          .map((t: any) => ({
            ...t,
            trainedModules: Array.isArray(t.trainedModules)
              ? t.trainedModules.filter((m: any) => m && m.id && m.module && m.module.id)
              : []
          }));

        console.log('✅ Valid trainers:', validTrainers.length);
        setTrainers(validTrainers);
      } else {
        console.error('❌ Failed to fetch trainers:', res.status);
      }
    } catch (error) {
      console.error('❌ Error fetching trainers:', error);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <CreateTrainerForm onCreated={refresh} />

      {/* List */}
      {loadingList ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <p className="text-4xl mb-3">👨‍🏫</p>
          <p className="text-slate-400">No trainers yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trainers.map((t) => (
            <TrainerRow
              key={t.id}
              trainer={t}
              allModules={allModules}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
