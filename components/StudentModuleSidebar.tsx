"use client";

import React from 'react';

/**
 * StudentModuleSidebar
 * 
 * Beautiful, interactive, 4-level hierarchical TOC sidebar for students
 * Learning Outcome → Indicative Content → Topics → Blocks (with subtopic grouping)
 * Each level is clickable and shows corresponding content
 */

import { useState, useEffect } from 'react';
import {
  Target, Zap, FlaskConical, Wrench, Rocket, Lightbulb,
  Palette, Sparkles, Star, Sun,
  ChevronRight, Check, PartyPopper, FolderOpen, BookMarked,
} from 'lucide-react';
import type { LearningOutcome, IndicativeContent, LearnTopic, LearnBlock } from '@/lib/learnContent';

// ─── Outcome icons — one lucide icon per slot ─────────────────────────────────
const OUTCOME_ICON_ELS = [
  <Target className="w-4 h-4" />,
  <Zap className="w-4 h-4" />,
  <FlaskConical className="w-4 h-4" />,
  <Wrench className="w-4 h-4" />,
  <Rocket className="w-4 h-4" />,
  <Lightbulb className="w-4 h-4" />,
  <Palette className="w-4 h-4" />,
  <Sparkles className="w-4 h-4" />,
  <Star className="w-4 h-4" />,
  <Sun className="w-4 h-4" />,
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  module: {
    moduleCode: string;
    title: string;
    tier: string;
  };
  outcomes: LearningOutcome[];
  activeOIdx: number;
  activeICIdx: number;
  activeTopicIdx: number;
  activeItemIdx?: number;  // NEW - track selected item index
  livePct: number;
  completedCount: number;
  totalBlocks: number;
  onNavigate: (oIdx: number, icIdx: number, tIdx: number, itemIdx?: number) => void;  // Add itemIdx parameter
  outcomePct: (outcome: LearningOutcome) => number;
  topicPct: (topic: LearnTopic) => number;
};

const OUTCOME_ICONS = OUTCOME_ICON_ELS; // kept for any legacy reference

const TIER_GRAD: Record<string, string> = {
  l3: "from-emerald-500 to-teal-500",
  l4: "from-sky-500 to-blue-600",
  l5: "from-violet-500 to-purple-600",
};

const TIER_ACCENT: Record<string, string> = {
  l3: "text-emerald-400",
  l4: "text-sky-400",
  l5: "text-violet-400",
};

// ─── Color Schemes for Each Level ────────────────────────────────────────────

// Learning Outcome - Blue theme 💙
const LO_COLORS = {
  text: "text-blue-300",
  textHover: "hover:text-blue-200",
  textActive: "text-blue-50",
  bg: "bg-blue-500/10",
  bgHover: "hover:bg-blue-500/20",
  bgActive: "bg-blue-500/30",
  border: "border-blue-500/30",
  borderHover: "hover:border-blue-400/50",
  borderActive: "border-blue-400/70",
  icon: "text-blue-400",
  gradient: "from-blue-500 to-blue-600",
};

// Indicative Content - Green theme 💚
const IC_COLORS = {
  text: "text-green-300",
  textHover: "hover:text-green-200",
  textActive: "text-green-50",
  bg: "bg-green-500/10",
  bgHover: "hover:bg-green-500/20",
  bgActive: "bg-green-500/30",
  border: "border-green-500/30",
  borderHover: "hover:border-green-400/50",
  borderActive: "border-green-400/70",
  icon: "text-green-400",
  gradient: "from-green-500 to-emerald-600",
};

// Topic - Orange theme 🧡
const TOPIC_COLORS = {
  text: "text-orange-300",
  textHover: "hover:text-orange-200",
  textActive: "text-orange-50",
  bg: "bg-orange-500/10",
  bgHover: "hover:bg-orange-500/20",
  bgActive: "bg-orange-500/30",
  border: "border-orange-500/30",
  borderHover: "hover:border-orange-400/50",
  borderActive: "border-orange-400/70",
  icon: "text-orange-400",
  gradient: "from-orange-500 to-orange-600",
};

// Subtopic - Yellow theme 💛
const SUBTOPIC_COLORS = {
  text: "text-yellow-300",
  textHover: "hover:text-yellow-200",
  textActive: "text-yellow-50",
  bg: "bg-yellow-500/10",
  bgHover: "hover:bg-yellow-500/20",
  bgActive: "bg-yellow-500/30",
  border: "border-yellow-500/30",
  borderHover: "hover:border-yellow-400/50",
  borderActive: "border-yellow-400/70",
  icon: "text-yellow-400",
  gradient: "from-yellow-500 to-amber-600",
};

// Item - Yellow theme (same as subtopic for consistency) 💛
const ITEM_COLORS = {
  text: "text-yellow-300",
  textHover: "hover:text-yellow-200",
  textActive: "text-yellow-50",
  bg: "bg-yellow-500/10",
  bgHover: "hover:bg-yellow-500/20",
  bgActive: "bg-yellow-500/30",
  border: "border-yellow-500/30",
  borderHover: "hover:border-yellow-400/50",
  borderActive: "border-yellow-400/70",
  icon: "text-yellow-400",
  gradient: "from-yellow-500 to-amber-600",
};

// ─── Progress Ring Component ──────────────────────────────────────────────────

function MiniProgressRing({ pct, size = 36, tier = 'l4' }: { pct: number; size?: number; tier?: string }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const colors: Record<string, [string, string]> = {
    l3: ["#34d399", "#10b981"],
    l4: ["#38bdf8", "#6366f1"],
    l5: ["#a78bfa", "#7c3aed"],
  };
  const [c1, c2] = colors[tier] ?? colors.l4;
  const gid = `mini-prg-${size}-${tier}-${Math.random()}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.34,1.56,.64,1)" }}
        />
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {pct === 100 ? (
          <Check className="w-3 h-3" style={{ color: c1 }} />
        ) : (
          <span className="text-[8px] font-extrabold" style={{ color: c1 }}>
            {Math.round(pct)}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper to group blocks into subtopics with items based on content structure
type Subtopic = { title: string; blockIndices: number[]; items: string[] };

function getSubtopicsFromBlocks(blocks: LearnBlock[]): Subtopic[] {
  const subtopics: Subtopic[] = [];
  let currentSubtopic: Subtopic | null = null;

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];

    // Text blocks with headings become subtopic titles
    if (block.type === 'text' && block.content) {
      const match = block.content.match(/^##\s+(.+)/m);
      if (match) {
        // Save previous subtopic if it has content
        if (currentSubtopic && currentSubtopic.blockIndices.length > 0) {
          subtopics.push(currentSubtopic);
        }
        // Start new subtopic
        currentSubtopic = { title: match[1].trim(), blockIndices: [idx], items: [] };
        continue;
      }
    }

    // Extract items from checklist blocks or bullet points in text blocks
    if (currentSubtopic) {
      if (block.type === 'checklist') {
        currentSubtopic.items.push(...block.items);
      } else if (block.type === 'text' && block.content) {
        // Extract bullet points as items
        const lines = block.content.split('\n');
        for (const line of lines) {
          const bulletMatch = line.match(/^[\s]*[-•*✓✔]\s+(.+)$/);
          if (bulletMatch) {
            currentSubtopic.items.push(bulletMatch[1].trim());
          }
        }
      }
      currentSubtopic.blockIndices.push(idx);
    } else {
      currentSubtopic = { title: 'Introduction', blockIndices: [idx], items: [] };
    }
  }

  // Push the last subtopic if it exists
  if (currentSubtopic && currentSubtopic.blockIndices.length > 0) {
    subtopics.push(currentSubtopic);
  }

  return subtopics.length > 0 ? subtopics : [{ title: 'Content', blockIndices: blocks.map((_, i) => i), items: [] }];
}

// ─── Main Component ───────────────────────────────────────────────────────────

function StudentModuleSidebar({
  module,
  outcomes,
  activeOIdx,
  activeICIdx,
  activeTopicIdx,
  activeItemIdx,  // NEW - destructure activeItemIdx
  livePct,
  completedCount,
  totalBlocks,
  onNavigate,
  outcomePct,
  topicPct,
}: Props) {
  const [expandedLOs, setExpandedLOs] = useState<Record<number, boolean>>(() => ({ 0: true }));
  const [expandedICs, setExpandedICs] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const tierGrad = TIER_GRAD[module.tier] ?? TIER_GRAD.l4;
  const tierAccent = TIER_ACCENT[module.tier] ?? TIER_ACCENT.l4;

  // Simple toggle functions - no complex logic
  const toggleLO = (oIdx: number) => {
    setExpandedLOs(prev => ({ ...prev, [oIdx]: !prev[oIdx] }));
  };

  const toggleIC = (key: string) => {
    setExpandedICs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-expand active hierarchy on mount and navigation - run ONCE per navigation
  useEffect(() => {
    setExpandedLOs(prev => ({ ...prev, [activeOIdx]: true }));
    setExpandedICs(prev => ({ ...prev, [`${activeOIdx}-${activeICIdx}`]: true }));
    setExpandedTopics(prev => ({ ...prev, [`${activeOIdx}-${activeICIdx}-${activeTopicIdx}`]: true }));
  }, [activeOIdx, activeICIdx, activeTopicIdx]);

  return (
    <div className="space-y-1 pb-8">
      {/* ── Module info card ── */}
      <div className={`mx-3 mb-4 rounded-2xl bg-gradient-to-br ${tierGrad} p-0.5 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="rounded-[14px] bg-slate-900 px-4 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Module</p>
            <p className={`text-xs font-extrabold ${tierAccent}`}>{module.moduleCode}</p>
            <p className="text-xs text-white font-semibold leading-snug mt-0.5">{module.title}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MiniProgressRing pct={livePct} size={44} tier={module.tier} />
              <div>
                <p className="text-sm font-extrabold text-white">{livePct}%</p>
                <p className="text-[10px] text-slate-400">{completedCount}/{totalBlocks} completed</p>
              </div>
            </div>
            {completedCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">{completedCount * 10} XP</span>
              </div>
            )}
          </div>

          <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tierGrad} transition-all duration-700 relative overflow-hidden`}
              style={{ width: `${livePct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Level Hierarchy: LO → IC → Topic → Subtopics ── */}
      <nav className="space-y-2 px-2">
        {outcomes.map((outcome, oIdx) => {
          const oPct = outcomePct(outcome);
          const isLOExpanded = expandedLOs[oIdx];
          const isLOActive = activeOIdx === oIdx;
          const oDone = oPct >= 100;

          return (
            <div key={outcome.number} className="rounded-xl overflow-hidden transition-all duration-300">
              {/* LEVEL 1: Learning Outcome - Purple/Violet Theme */}
              <button
                onClick={() => toggleLO(oIdx)}
                onMouseEnter={() => setHoveredItem(`lo-${oIdx}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full text-left flex items-start gap-2.5 px-4 py-3 rounded-xl transition-all duration-300 border ${isLOActive
                  ? `${LO_COLORS.bgActive} ${LO_COLORS.borderActive} ${LO_COLORS.textActive} shadow-lg shadow-blue-500/20 scale-[1.02]`
                  : hoveredItem === `lo-${oIdx}`
                    ? `${LO_COLORS.bgHover} ${LO_COLORS.borderHover} ${LO_COLORS.textHover} shadow-md scale-[1.01]`
                    : `${LO_COLORS.bg} ${LO_COLORS.border} ${LO_COLORS.text}`
                  }`}
              >
                <span className={`text-lg mt-0.5 shrink-0 ${LO_COLORS.icon} transition-transform duration-300 ${hoveredItem === `lo-${oIdx}` ? "scale-125" : ""}`}>
                  {OUTCOME_ICON_ELS[oIdx % OUTCOME_ICON_ELS.length]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isLOActive ? "text-blue-200" : "text-blue-400/70"}`}>
                      LO {outcome.number}
                    </p>
                    <span className="text-[8px] text-slate-600">•</span>
                    <p className="text-[10px] text-slate-500">{outcome.learningHours}h</p>
                    <span className="text-[8px] text-slate-600">•</span>
                    <p className="text-[10px] text-slate-500">{outcome.indicativeContents.length} sections</p>
                  </div>
                  <p className={`text-xs font-bold leading-tight mt-1 ${isLOActive ? LO_COLORS.textActive : LO_COLORS.text}`}>
                    {outcome.title}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {oPct > 0 && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${oDone ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {oDone ? <><Check className="w-3 h-3 inline" /> Done</> : `${oPct}%`}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 ${LO_COLORS.icon} transition-transform duration-300 ${isLOExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              {oPct > 0 && (
                <div className="mx-4 mt-1.5 h-[3px] rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${oDone ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                    style={{ width: `${oPct}%` }}
                  />
                </div>
              )}

              {/* LEVEL 2: Indicative Contents */}
              {isLOExpanded && (
                <div className="mt-2 ml-4 space-y-1 animate-in slide-in-from-top-2 fade-in duration-300">
                  {outcome.indicativeContents.map((ic, icIdx) => {
                    const icKey = `${oIdx}-${icIdx}`;
                    const isICExpanded = expandedICs[icKey];
                    const isICActive = activeOIdx === oIdx && activeICIdx === icIdx;

                    // Calculate IC progress
                    const icTopics = ic.topics;
                    const icProgress = icTopics.length > 0
                      ? Math.round((icTopics.reduce((sum, t) => sum + topicPct(t), 0) / icTopics.length))
                      : 0;

                    return (
                      <div key={ic.id} className="rounded-lg overflow-hidden">
                        {/* LEVEL 2: Indicative Content - Green Theme */}
                        <button
                          onClick={() => toggleIC(icKey)}
                          onMouseEnter={() => setHoveredItem(icKey)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${isICActive
                            ? `${IC_COLORS.bgActive} ${IC_COLORS.borderActive} ${IC_COLORS.textActive} shadow-sm shadow-green-500/10`
                            : hoveredItem === icKey
                              ? `${IC_COLORS.bgHover} ${IC_COLORS.borderHover} ${IC_COLORS.textHover}`
                              : `${IC_COLORS.bg} ${IC_COLORS.border} ${IC_COLORS.text}`
                            }`}
                        >
                          <FolderOpen className={`w-4 h-4 ${IC_COLORS.icon}`} />
                          <span className="flex-1 text-xs font-semibold">{ic.title}</span>
                          {icProgress > 0 && (
                            <span className="text-[9px] text-amber-400">{icProgress}%</span>
                          )}
                          <ChevronRight className={`w-3 h-3 ${IC_COLORS.icon} transition-transform duration-200 ${isICExpanded ? "rotate-90" : ""}`} />
                        </button>

                        {/* LEVEL 3: Topics */}
                        {isICExpanded && (
                          <div className="ml-4 mt-1 space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
                            {ic.topics.map((topic, tIdx) => {
                              const topicKey = `${oIdx}-${icIdx}-${tIdx}`;
                              const isTopicExpanded = expandedTopics[topicKey];
                              const isTopicActive = activeOIdx === oIdx && activeICIdx === icIdx && activeTopicIdx === tIdx;
                              const tPct = topicPct(topic);
                              const topicDone = tPct >= 100;

                              // Curriculum items (4th level) — directly from curriculum structure
                              const hasDirectItems = Array.isArray(topic.items) && topic.items.length > 0;
                              // Block-based subtopics — fallback when no curriculum items
                              const blockSubtopics = getSubtopicsFromBlocks(topic.blocks);
                              const hasBlockSubtopics = blockSubtopics.length > 1;
                              const isExpandable = hasDirectItems || hasBlockSubtopics;

                              return (
                                <div key={topic.id} className="rounded-lg overflow-hidden">
                                  {/* LEVEL 3: Topic - Orange Theme
                                      Navigate (title click) and expand (▶ click) are SEPARATE
                                      so the items stay visible once expanded */}
                                  <div className="flex items-stretch">
                                    {/* Title — navigates to topic content */}
                                    <button
                                      onClick={() => {
                                        onNavigate(oIdx, icIdx, tIdx);
                                        // Auto-open items on first click if not yet expanded
                                        if (isExpandable && !isTopicExpanded) toggleTopic(topicKey);
                                      }}
                                      onMouseEnter={() => setHoveredItem(topicKey)}
                                      onMouseLeave={() => setHoveredItem(null)}
                                      className={`flex-1 min-w-0 text-left flex items-center gap-2 px-3 py-2 rounded-l-lg transition-all duration-200 group border-t border-b border-l ${isTopicActive
                                        ? `${TOPIC_COLORS.bgActive} ${TOPIC_COLORS.borderActive} ${TOPIC_COLORS.textActive} font-semibold shadow-sm shadow-orange-500/10`
                                        : hoveredItem === topicKey
                                          ? `${TOPIC_COLORS.bgHover} ${TOPIC_COLORS.borderHover} ${TOPIC_COLORS.textHover}`
                                          : `${TOPIC_COLORS.bg} ${TOPIC_COLORS.border} ${TOPIC_COLORS.text}`
                                        }`}
                                    >
                                      <div className="relative shrink-0">
                                        {topicDone ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : tPct > 0 ? (
                                          <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                          </span>
                                        ) : (
                                          <span className={`w-2.5 h-2.5 rounded-full border-2 ${TOPIC_COLORS.border} group-hover:border-orange-500/50`} />
                                        )}
                                      </div>
                                      <span className="flex-1 text-xs leading-snug">{topic.title}</span>
                                      {tPct > 0 && !topicDone && (
                                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{tPct}%</span>
                                      )}
                                    </button>
                                    {/* Expand toggle — independent of navigate */}
                                    {isExpandable && (
                                      <button
                                        onClick={() => toggleTopic(topicKey)}
                                        onMouseEnter={() => setHoveredItem(topicKey)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`shrink-0 px-2.5 rounded-r-lg border-t border-b border-r transition-all duration-200 ${isTopicActive
                                          ? `${TOPIC_COLORS.bgActive} ${TOPIC_COLORS.borderActive}`
                                          : hoveredItem === topicKey
                                            ? `${TOPIC_COLORS.bgHover} ${TOPIC_COLORS.borderHover}`
                                            : `${TOPIC_COLORS.bg} ${TOPIC_COLORS.border}`
                                          }`}
                                      >
                                        <ChevronRight className={`w-3 h-3 ${TOPIC_COLORS.icon} transition-transform duration-200 ${isTopicExpanded ? "rotate-90" : ""}`} />
                                      </button>
                                    )}
                                  </div>

                                  {/* LEVEL 4: Direct Items from Curriculum - Yellow Theme 💛 */}
                                  {isTopicExpanded && hasDirectItems && (
                                    <div className="ml-4 mt-1 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-150">
                                      {topic.items!.map((item, itemIdx) => {
                                        const isItemActive = isTopicActive && activeItemIdx === itemIdx;
                                        return (
                                          <button
                                            key={itemIdx}
                                            onClick={(e) => {
                                              e.preventDefault(); // Prevent default focus scroll
                                              onNavigate(oIdx, icIdx, tIdx, itemIdx);
                                            }}
                                            onMouseEnter={() => setHoveredItem(`item-${topicKey}-${itemIdx}`)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            style={{ scrollMargin: 0 }} // Prevent scroll-into-view
                                            className={`w-full text-left flex items-start gap-1.5 px-2 py-1 rounded border transition-all duration-150 text-[10px] ${isItemActive
                                              ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive}`
                                              : hoveredItem === `item-${topicKey}-${itemIdx}`
                                                ? `${ITEM_COLORS.bgHover} ${ITEM_COLORS.borderHover} ${ITEM_COLORS.textHover}`
                                                : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text}`
                                              }`}
                                          >
                                            <Check className={`w-3 h-3 mt-0.5 ${ITEM_COLORS.icon}`} />
                                            <span className="flex-1 leading-snug">{item}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* LEVEL 4: Block subtopics (fallback, no curriculum items) - Yellow Theme */}
                                  {isTopicExpanded && !hasDirectItems && blockSubtopics.length > 1 && (
                                    <div className="ml-4 mt-1 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                      {blockSubtopics.map((subtopic, subIdx) => {
                                        const subtopicKey = `${topicKey}-sub-${subIdx}`;
                                        const hasItems = subtopic.items && subtopic.items.length > 0;

                                        return (
                                          <div key={subIdx}>
                                            <button
                                              onClick={() => {
                                                onNavigate(oIdx, icIdx, tIdx);
                                                if (hasItems) toggleTopic(subtopicKey);
                                              }}
                                              onMouseEnter={() => setHoveredItem(`sub-${topicKey}-${subIdx}`)}
                                              onMouseLeave={() => setHoveredItem(null)}
                                              className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded border transition-all duration-200 ${isTopicActive
                                                ? `${SUBTOPIC_COLORS.bgActive} ${SUBTOPIC_COLORS.borderActive} ${SUBTOPIC_COLORS.textActive}`
                                                : hoveredItem === `sub-${topicKey}-${subIdx}`
                                                  ? `${SUBTOPIC_COLORS.bgHover} ${SUBTOPIC_COLORS.borderHover} ${SUBTOPIC_COLORS.textHover}`
                                                  : `${SUBTOPIC_COLORS.bg} ${SUBTOPIC_COLORS.border} ${SUBTOPIC_COLORS.text}`
                                                }`}
                                            >
                                              <span className={`mt-0.5 text-xs ${SUBTOPIC_COLORS.icon}`}><ChevronRight className="w-3 h-3" /></span>
                                              <span className="flex-1 leading-snug text-[11px]">{subtopic.title}</span>
                                              {hasItems && (
                                                <>
                                                  <span className="text-[9px] text-slate-600">{subtopic.items.length}</span>
                                                  <ChevronRight className={`w-2.5 h-2.5 ${SUBTOPIC_COLORS.icon} transition-transform duration-200 ${expandedTopics[subtopicKey] ? "rotate-90" : ""}`} />
                                                </>
                                              )}
                                            </button>

                                            {/* LEVEL 5: Items from block subtopics - Yellow Theme 💛 */}
                                            {expandedTopics[subtopicKey] && hasItems && (
                                              <div className="ml-4 mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-150">
                                                {subtopic.items.map((item, itemIdx) => {
                                                  const isItemActive = isTopicActive && activeItemIdx === itemIdx;
                                                  return (
                                                    <button
                                                      key={itemIdx}
                                                      onClick={(e) => {
                                                        e.preventDefault(); // Prevent default focus scroll
                                                        onNavigate(oIdx, icIdx, tIdx, itemIdx);
                                                      }}
                                                      onMouseEnter={() => setHoveredItem(`item-${subtopicKey}-${itemIdx}`)}
                                                      onMouseLeave={() => setHoveredItem(null)}
                                                      style={{ scrollMargin: 0 }} // Prevent scroll-into-view
                                                      className={`w-full text-left flex items-start gap-1.5 px-2 py-1 rounded border transition-all duration-150 text-[10px] ${isItemActive
                                                        ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive}`
                                                        : hoveredItem === `item-${subtopicKey}-${itemIdx}`
                                                          ? `${ITEM_COLORS.bgHover} ${ITEM_COLORS.borderHover} ${ITEM_COLORS.textHover}`
                                                          : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text}`
                                                        }`}
                                                    >
                                                      <Check className={`w-3 h-3 mt-0.5 ${ITEM_COLORS.icon}`} />
                                                      <span className="flex-1 leading-snug">{item}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Module complete celebration */}
      {livePct === 100 && (
        <div className={`mx-3 mt-6 p-4 rounded-xl bg-gradient-to-br ${tierGrad} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="flex items-center gap-3">
            <PartyPopper className="w-7 h-7 text-white animate-bounce shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-white">Module Complete!</p>
              <p className="text-[10px] text-white/80">Amazing work! You've mastered all {totalBlocks} activities</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}



// Memoize component to prevent unnecessary re-renders
export default React.memo(StudentModuleSidebar);
