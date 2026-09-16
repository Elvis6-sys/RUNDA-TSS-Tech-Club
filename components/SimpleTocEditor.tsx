"use client";

/**
 * Simplified TOC Editor - Matches Content TOC Visual Style
 * 
 * Features:
 * - Visual hierarchy with proper indentation
 * - Simple up/down arrow buttons for reordering
 * - Minimal UI - focuses on what teachers need
 * - Matches Content TOC appearance exactly
 */

import { useState, useEffect } from 'react';
import {
  Target, Circle, Check, Dot, ChevronRight, ChevronDown,
  Plus, Edit3, X, Save, ChevronUp, Trash2
} from 'lucide-react';

type TocEntry = {
  id: string;
  type: 'learningOutcome' | 'topic' | 'subtopic' | 'item';
  parentId: string | null;
  title: string;
  description?: string | null;
  hours?: number | null;
  order: number;
  isCustom: boolean;
  sourceId?: string | null;
  children?: TocEntry[];
};

type SimpleTocEditorProps = {
  trackId: string;
  entries: TocEntry[];
  onUpdate: () => void;
};

export default function SimpleTocEditor({ trackId, entries, onUpdate }: SimpleTocEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formHours, setFormHours] = useState<number | ''>('');

  // Build hierarchical tree
  const buildTree = (entries: TocEntry[]): TocEntry[] => {
    const map = new Map<string, TocEntry>();
    entries.forEach(e => map.set(e.id, { ...e, children: [] }));

    const roots: TocEntry[] = [];

    entries.forEach(e => {
      const node = map.get(e.id)!;
      if (e.parentId) {
        let parent = map.get(e.parentId);
        if (!parent) {
          const customReplacement = entries.find(entry =>
            entry.isCustom && entry.sourceId === e.parentId
          );
          if (customReplacement) {
            parent = map.get(customReplacement.id);
          }
        }
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (node: TocEntry) => {
      if (node.children) {
        node.children.sort((a, b) => a.order - b.order);
        node.children.forEach(sortChildren);
      }
    };
    roots.forEach(sortChildren);

    return roots.sort((a, b) => a.order - b.order);
  };

  const tree = buildTree(entries);

  // Expand all learning outcomes by default
  useEffect(() => {
    const outcomeIds = entries
      .filter(e => e.type === 'learningOutcome')
      .map(e => e.id);
    setExpandedIds(new Set(outcomeIds));
  }, [entries.length]);

  //  Make entry editable
  const handleMakeEditable = async (entry: TocEntry) => {
    if (entry.isCustom) {
      // Already editable, just start editing
      setEditingId(entry.id);
      setFormTitle(entry.title);
      setFormHours(entry.hours || '');
      return;
    }

    // Convert default to custom
    try {
      const res = await fetch(`/api/toc/${trackId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entry.type,
          parentId: entry.parentId,
          title: entry.title,
          description: entry.description,
          hours: entry.hours,
          order: entry.order,
          replaceDefaultId: entry.sourceId || entry.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to make editable');
      
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Now editable';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 1500);

      await onUpdate();
    } catch (error) {
      console.error('Error making editable:', error);
      alert('Failed to make editable. Please try again.');
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId || !formTitle.trim()) return;

    const entry = entries.find(e => e.id === editingId);
    if (!entry) return;

    try {
      const res = await fetch(`/api/toc/entry/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          hours: formHours || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Saved';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 1500);

      setEditingId(null);
      setFormTitle('');
      setFormHours('');
      await onUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    }
  };

  // Move up
  const handleMoveUp = async (entry: TocEntry) => {
    if (!entry.isCustom) return;

    const siblings = entries
      .filter(e =>
        e.type === entry.type &&
        e.parentId === entry.parentId &&
        e.isCustom
      )
      .sort((a, b) => a.order - b.order);

    const currentIndex = siblings.findIndex(s => s.id === entry.id);
    if (currentIndex <= 0) return;

    const prevSibling = siblings[currentIndex - 1];
    const newOrder = currentIndex === 1
      ? prevSibling.order - 1
      : (siblings[currentIndex - 2].order + prevSibling.order) / 2;

    try {
      const res = await fetch(`/api/toc/entry/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!res.ok) throw new Error('Failed to reorder');

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Moved up';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 1500);

      onUpdate();
    } catch (error) {
      console.error('Move up error:', error);
      alert('Failed to move up. Please try again.');
    }
  };

  // Move down
  const handleMoveDown = async (entry: TocEntry) => {
    if (!entry.isCustom) return;

    const siblings = entries
      .filter(e =>
        e.type === entry.type &&
        e.parentId === entry.parentId &&
        e.isCustom
      )
      .sort((a, b) => a.order - b.order);

    const currentIndex = siblings.findIndex(s => s.id === entry.id);
    if (currentIndex >= siblings.length - 1) return;

    const nextSibling = siblings[currentIndex + 1];
    const newOrder = currentIndex === siblings.length - 2
      ? nextSibling.order + 1
      : (nextSibling.order + siblings[currentIndex + 2].order) / 2;

    try {
      const res = await fetch(`/api/toc/entry/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!res.ok) throw new Error('Failed to reorder');

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Moved down';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 1500);

      onUpdate();
    } catch (error) {
      console.error('Move down error:', error);
      alert('Failed to move down. Please try again.');
    }
  };

  // Delete entry
  const handleDelete = async (entry: TocEntry) => {
    if (!entry.isCustom) return;
    if (!confirm(`Delete "${entry.title}"?`)) return;

    try {
      const res = await fetch(`/api/toc/entry/${entry.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Deleted';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 1500);

      onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  // Render entry
  const renderEntry = (entry: TocEntry, level: number = 0): JSX.Element => {
    const isExpanded = expandedIds.has(entry.id);
    const hasChildren = entry.children && entry.children.length > 0;
    const isEditing = editingId === entry.id;

    const icon = entry.type === 'learningOutcome' ? <Target className="w-5 h-5 text-violet-400" /> :
      entry.type === 'topic' ? <Circle className="w-4 h-4 text-blue-400" /> :
        entry.type === 'subtopic' ? <Check className="w-3 h-3 text-emerald-400" /> : 
        <Dot className="w-3 h-3 text-slate-400" />;

    const indent = level * 24; // Indent by 24px per level

    return (
      <div key={entry.id}>
        <div
          style={{ paddingLeft: `${indent}px` }}
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg
            ${entry.isCustom ? 'bg-violet-500/10 hover:bg-violet-500/20' : 'bg-slate-800/30 hover:bg-slate-700/50'}
            ${entry.type === 'learningOutcome' ? 'mb-2 mt-3' : 'mb-1'}
            transition-colors duration-150
          `}
        >
          {/* Expand/collapse */}
          {hasChildren ? (
            <button
              onClick={() => {
                const newExpanded = new Set(expandedIds);
                if (isExpanded) {
                  newExpanded.delete(entry.id);
                } else {
                  newExpanded.add(entry.id);
                }
                setExpandedIds(newExpanded);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon */}
          <div className="shrink-0">{icon}</div>

          {/* Content */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Title"
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') {
                    setEditingId(null);
                    setFormTitle('');
                    setFormHours('');
                  }
                }}
              />
              {entry.type === 'learningOutcome' && (
                <input
                  type="number"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Hours"
                  className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                />
              )}
              <button onClick={handleSaveEdit} className="p-1.5 text-emerald-400 hover:text-emerald-300" title="Save">
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormTitle('');
                  setFormHours('');
                }}
                className="p-1.5 text-slate-400 hover:text-white"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className={`
                  ${entry.type === 'learningOutcome' ? 'text-base font-semibold' : 
                    entry.type === 'topic' ? 'text-sm font-medium' : 'text-sm'}
                  text-white truncate
                `}>
                  {entry.title}
                </div>
                {entry.hours && <span className="text-xs text-slate-400">{entry.hours}h</span>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {entry.isCustom ? (
                  <>
                    {/* Up/Down arrows */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveUp(entry)}
                        className="p-0.5 text-slate-500 hover:text-blue-400"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(entry)}
                        className="p-0.5 text-slate-500 hover:text-blue-400"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingId(entry.id);
                        setFormTitle(entry.title);
                        setFormHours(entry.hours || '');
                      }}
                      className="p-1.5 text-blue-400 hover:text-blue-300"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMakeEditable(entry)}
                    className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded"
                  >
                    Make Editable
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div>
            {entry.children!.map(child => renderEntry(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Simple instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">Edit Table of Contents</h3>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Click ↑↓ arrows to reorder items</li>
          <li>• Click "Edit" to change titles</li>
          <li>• Click "Make Editable" to modify default entries</li>
          <li>• All changes save automatically</li>
        </ul>
      </div>

      {/* Render tree */}
      <div className="space-y-1">
        {tree.map(entry => renderEntry(entry, 0))}
      </div>
    </div>
  );
}
