"use client";

/**
 * StudentModuleSidebarTOC
 * Simple TOC-based sidebar (like teacher) - stable, no scrolling issues
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Target, FolderOpen, FileText, Circle } from 'lucide-react';

// Color schemes (matching teacher sidebar)
const LO_COLORS = {
  text: "text-blue-300",
  textActive: "text-blue-50",
  bg: "bg-blue-500/10",
  bgHover: "hover:bg-blue-500/20",
  bgActive: "bg-blue-500/30",
  border: "border-blue-500/30",
  borderActive: "border-blue-400/70",
  icon: "text-blue-400",
  dot: "bg-blue-400",
};

const TOPIC_COLORS = {
  text: "text-green-300",
  textHover: "hover:text-green-200",
  textActive: "text-green-50",
  bg: "bg-green-500/10",
  bgHover: "hover:bg-green-500/20",
  bgActive: "bg-green-500/30",
  border: "border-green-500/30",
  borderActive: "border-green-400/70",
  icon: "text-green-400",
  dot: "bg-green-400",
};

const SUBTOPIC_COLORS = {
  text: "text-orange-300",
  textHover: "hover:text-orange-200",
  textActive: "text-orange-50",
  bg: "bg-orange-500/10",
  bgActive: "bg-orange-500/30",
  border: "border-orange-500/30",
  borderActive: "border-orange-400/70",
  icon: "text-orange-400",
};

const ITEM_COLORS = {
  text: "text-yellow-300",
  textHover: "hover:text-yellow-200",
  textActive: "text-yellow-50",
  bg: "bg-yellow-500/10",
  bgActive: "bg-yellow-500/30",
  border: "border-yellow-500/30",
  borderActive: "border-yellow-400/70",
  icon: "text-yellow-400",
};

type TOCItem = {
  id: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  title: string;
  parentId?: string;
  hours?: number;
  items?: string[];
};

type Props = {
  toc: TOCItem[];
  activeId: string | null;
  onSelect: (item: TOCItem) => void;
  moduleCode: string;
  moduleTitle: string;
  tier: string;
};

export default function StudentModuleSidebarTOC({
  toc,
  activeId,
  onSelect,
  moduleCode,
  moduleTitle,
  tier,
}: Props) {
  const outcomes = toc.filter(t => t.type === "outcome");

  // Initialize state ONLY ONCE - don't reset on re-render
  const [openOutcomes, setOpenOutcomes] = useState<Record<string, boolean>>(() => {
    // Start with first outcome open
    const initial: Record<string, boolean> = {};
    if (outcomes.length > 0) {
      initial[outcomes[0].id] = true;
    }
    return initial;
  });
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [openSubtopics, setOpenSubtopics] = useState<Record<string, boolean>>({});

  // Keep active hierarchy open - but don't collapse others
  useEffect(() => {
    if (!activeId) return;

    // Find which outcome/topic/subtopic contains this activeId
    for (const outcome of outcomes) {
      const topics = topicsFor(outcome.id);
      for (const topic of topics) {
        const subs = subtopicsFor(topic.id);
        for (const sub of subs) {
          if (sub.id === activeId || (sub.items && sub.items.some((_, idx) => {
            const itemId = `item-${outcomes.indexOf(outcome)}-${topics.indexOf(topic)}-${subs.indexOf(sub)}-${idx}`;
            return itemId === activeId;
          }))) {
            // Keep this path open without closing others
            setOpenOutcomes(prev => ({ ...prev, [outcome.id]: true }));
            setOpenTopics(prev => ({ ...prev, [topic.id]: true }));
            setOpenSubtopics(prev => ({ ...prev, [sub.id]: true }));
            return;
          }
        }

        if (topic.id === activeId) {
          setOpenOutcomes(prev => ({ ...prev, [outcome.id]: true }));
          setOpenTopics(prev => ({ ...prev, [topic.id]: true }));
          return;
        }
      }

      if (outcome.id === activeId) {
        setOpenOutcomes(prev => ({ ...prev, [outcome.id]: true }));
        return;
      }
    }
  }, [activeId, outcomes]);

  function toggleOutcome(id: string) {
    setOpenOutcomes(p => ({ ...p, [id]: !p[id] }));
  }
  function toggleTopic(id: string) {
    setOpenTopics(p => ({ ...p, [id]: !p[id] }));
  }
  function toggleSubtopic(id: string) {
    setOpenSubtopics(p => ({ ...p, [id]: !p[id] }));
  }

  const topicsFor = (parentId: string) => toc.filter(t => t.type === "topic" && t.parentId === parentId);
  const subtopicsFor = (parentId: string) => toc.filter(t => t.type === "subtopic" && t.parentId === parentId);

  if (toc.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-slate-500 text-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Contents</p>
        <p className="text-xs">Loading module structure...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Module header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Module</p>
        <p className="text-xs font-extrabold text-sky-400">{moduleCode}</p>
        <p className="text-xs text-white font-semibold leading-snug mt-0.5">{moduleTitle}</p>
      </div>

      {/* TOC Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1">
        {outcomes.map((outcome, oi) => {
          const topics = topicsFor(outcome.id);
          const isOpen = openOutcomes[outcome.id];
          const isActive = activeId === outcome.id;

          return (
            <div key={outcome.id}>
              {/* Learning Outcome */}
              <button
                onClick={() => { onSelect(outcome); toggleOutcome(outcome.id); }}
                className={`w-full text-left flex items-start gap-2.5 px-4 py-2.5 rounded-xl mx-2 transition border ${isActive
                  ? `${LO_COLORS.bgActive} ${LO_COLORS.borderActive} ${LO_COLORS.textActive} shadow-lg shadow-blue-500/20`
                  : `${LO_COLORS.bg} ${LO_COLORS.border} ${LO_COLORS.text} ${LO_COLORS.bgHover}`
                  }`}
                style={{ width: "calc(100% - 1rem)" }}
              >
                {/* Learning Outcome Icon - Target/Goal */}
                <Target className={`w-4 h-4 ${LO_COLORS.icon} shrink-0 mt-0.5`} />
                <span className="flex-1 text-xs font-bold leading-snug">{outcome.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {outcome.hours && (
                    <span className="text-[9px] font-mono opacity-60">{outcome.hours}h</span>
                  )}
                  <ChevronRight className={`w-3 h-3 ${LO_COLORS.icon} transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* Topics */}
              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {topics.map((topic) => {
                    const subs = subtopicsFor(topic.id);
                    const isTopicOpen = openTopics[topic.id];
                    const isTopicActive = activeId === topic.id;

                    return (
                      <div key={topic.id}>
                        {/* Topic */}
                        <button
                          onClick={() => { onSelect(topic); if (subs.length) toggleTopic(topic.id); }}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition text-xs border ${isTopicActive
                            ? `${TOPIC_COLORS.bgActive} ${TOPIC_COLORS.borderActive} ${TOPIC_COLORS.textActive} font-semibold shadow-sm`
                            : `${TOPIC_COLORS.bg} ${TOPIC_COLORS.border} ${TOPIC_COLORS.text} ${TOPIC_COLORS.bgHover} ${TOPIC_COLORS.textHover}`
                            }`}
                        >
                          {/* Topic Icon - Folder */}
                          <FolderOpen className={`w-3.5 h-3.5 ${TOPIC_COLORS.icon} shrink-0`} />
                          <span className="flex-1 leading-snug">{topic.title}</span>
                          {subs.length > 0 && (
                            <>
                              <span className="text-[9px] text-slate-600 shrink-0">{subs.length}</span>
                              <ChevronRight className={`w-2.5 h-2.5 ${TOPIC_COLORS.icon} shrink-0 transition-transform ${isTopicOpen ? "rotate-90" : ""}`} />
                            </>
                          )}
                        </button>

                        {/* Subtopics */}
                        {isTopicOpen && subs.map((sub) => {
                          // Check for items in both formats: separate TOC entries OR string array
                          const itemEntries = toc.filter(t => t.type === "item" && t.parentId === sub.id);
                          const legacyItems = sub.items && sub.items.length > 0;
                          const hasItems = itemEntries.length > 0 || legacyItems;
                          const subExpanded = openSubtopics[sub.id] || false;
                          const isSubActive = activeId === sub.id;

                          return (
                            <div key={sub.id}>
                              {/* Subtopic */}
                              <button
                                onClick={() => {
                                  onSelect(sub);
                                  if (hasItems) toggleSubtopic(sub.id);
                                }}
                                className={`w-full text-left flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg transition text-[11px] border ${isSubActive
                                  ? `${SUBTOPIC_COLORS.bgActive} ${SUBTOPIC_COLORS.borderActive} ${SUBTOPIC_COLORS.textActive} font-medium shadow-sm`
                                  : `${SUBTOPIC_COLORS.bg} ${SUBTOPIC_COLORS.border} ${SUBTOPIC_COLORS.text} ${SUBTOPIC_COLORS.textHover}`
                                  }`}
                              >
                                {/* Subtopic Icon - Document */}
                                <FileText className={`w-3 h-3 ${SUBTOPIC_COLORS.icon} shrink-0`} />
                                <span className="flex-1 leading-snug">{sub.title}</span>
                                {hasItems && (
                                  <>
                                    <span className="text-[9px] text-slate-600 shrink-0">
                                      {itemEntries.length || sub.items?.length || 0}
                                    </span>
                                    <ChevronRight className={`w-2.5 h-2.5 ${SUBTOPIC_COLORS.icon} shrink-0 transition-transform ${subExpanded ? "rotate-90" : ""}`} />
                                  </>
                                )}
                              </button>

                              {/* Items (4th level) */}
                              {subExpanded && hasItems && (
                                <div className="ml-4 mt-0.5 space-y-0.5">
                                  {/* Render separate TOC item entries (NEW format - matches teacher) */}
                                  {itemEntries.map((itemEntry) => {
                                    const isItemActive = activeId === itemEntry.id;

                                    return (
                                      <button
                                        key={itemEntry.id}
                                        onClick={() => onSelect(itemEntry)}
                                        className={`w-full text-left flex items-start gap-1.5 pl-7 pr-3 py-1 rounded-lg transition text-[10px] leading-snug border ${isItemActive
                                          ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive} shadow-sm`
                                          : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text} ${ITEM_COLORS.textHover}`
                                          }`}
                                      >
                                        <Circle className={`w-2.5 h-2.5 ${ITEM_COLORS.icon} shrink-0 mt-0.5 fill-current`} />
                                        <span className="flex-1">{itemEntry.title}</span>
                                      </button>
                                    );
                                  })}

                                  {/* Render legacy string array items (BACKWARDS COMPATIBILITY) */}
                                  {!itemEntries.length && sub.items && sub.items.map((itemText, itemIdx) => {
                                    const outIdx = outcomes.findIndex(o => o.id === outcome.id);
                                    const topicIdx = topics.findIndex(t => t.id === topic.id);
                                    const subIdx = subs.findIndex(s => s.id === sub.id);
                                    const itemId = `item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
                                    const isItemActive = activeId === itemId;

                                    return (
                                      <button
                                        key={itemIdx}
                                        onClick={() => {
                                          const itemObj: TOCItem & { _isItem?: boolean } = {
                                            id: itemId,
                                            type: 'item',
                                            title: itemText,
                                            parentId: sub.id,
                                            _isItem: true,
                                          };
                                          onSelect(itemObj as any);
                                        }}
                                        className={`w-full text-left flex items-start gap-1.5 pl-7 pr-3 py-1 rounded-lg transition text-[10px] leading-snug border ${isItemActive
                                          ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive} shadow-sm`
                                          : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text} ${ITEM_COLORS.textHover}`
                                          }`}
                                      >
                                        <Circle className={`w-2.5 h-2.5 ${ITEM_COLORS.icon} shrink-0 mt-0.5 fill-current`} />
                                        <span className="flex-1">{itemText}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
