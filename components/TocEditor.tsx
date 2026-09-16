"use client";

/**
 * Enhanced TocEditor with Advanced Editing Features
 * 
 * Features:
 * - Convert types (topic→subtopic, item→topic, etc.)
 * - Add items at any level
 * - Drag & drop reordering
 * - Inline editing
 * - Context menu actions
 * - Bulk operations
 */

import { useState, useRef } from 'react';
import {
  Target, Circle, Check, Dot, ChevronRight, ChevronDown,
  Plus, GripVertical, Lightbulb, Trash2, Edit3, Save, X,
  MoreVertical, Copy, MoveUp, MoveDown, ArrowRight, ArrowLeft,
  FolderPlus, ListPlus, FileText, Repeat
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
  sourceId?: string | null; // Original TOC item ID this entry represents/replaces
  children?: TocEntry[];
};

type Props = {
  trackId: string;
  entries: TocEntry[];
  onUpdate: () => void;
};

// Context menu for advanced actions
function ContextMenu({
  entry,
  onConvertType,
  onAddItem,
  onDuplicate,
  onDelete,
  onClose,
}: {
  entry: TocEntry;
  onConvertType: (to: string) => void;
  onAddItem: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const canConvertTo = {
    learningOutcome: [],
    topic: ['subtopic'],
    subtopic: ['topic', 'item'],
    item: ['subtopic'],
  };

  const conversions = canConvertTo[entry.type] || [];

  return (
    <div className="absolute right-0 top-8 z-50 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="p-2 space-y-1">
        {/* Convert Type */}
        {conversions.length > 0 && (
          <>
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Convert Type
            </div>
            {conversions.map((targetType) => (
              <button
                key={targetType}
                onClick={() => { onConvertType(targetType); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-violet-500/20 transition"
              >
                <Repeat className="w-4 h-4 text-violet-400" />
                <span>Convert to {targetType === 'subtopic' ? 'Subtopic' : targetType === 'topic' ? 'Topic' : 'Item'}</span>
              </button>
            ))}
            <div className="h-px bg-slate-700 my-1" />
          </>
        )}

        {/* Add Item */}
        {entry.type !== 'item' && (
          <button
            onClick={() => { onAddItem(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-emerald-500/20 transition"
          >
            <ListPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Item</span>
          </button>
        )}

        {/* Duplicate */}
        {entry.isCustom && (
          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-blue-500/20 transition"
          >
            <Copy className="w-4 h-4 text-blue-400" />
            <span>Duplicate</span>
          </button>
        )}

        {/* Delete */}
        {entry.isCustom && (
          <>
            <div className="h-px bg-slate-700 my-1" />
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TocEditor({ trackId, entries, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<string | null>(null);
  const [addingParent, setAddingParent] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHours, setFormHours] = useState<number | ''>('');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const startAdd = (type: string, parentId: string | null = null) => {
    setAddingType(type);
    setAddingParent(parentId);
    setFormTitle('');
    setFormDescription('');
    setFormHours('');
    setEditingId(null);
    setContextMenuId(null);
  };

  const startEdit = (entry: TocEntry) => {
    setEditingId(entry.id);
    setFormTitle(entry.title);
    setFormDescription(entry.description || '');
    setFormHours(entry.hours || '');
    setAddingType(null);
    setContextMenuId(null);
  };

  const cancelForm = () => {
    setEditingId(null);
    setAddingType(null);
    setAddingParent(null);
    setFormTitle('');
    setFormDescription('');
    setFormHours('');
  };

  const handleMakeEditable = async (entry: TocEntry) => {
    if (entry.isCustom) return; // Already custom

    try {
      // Find the actual parentId to use
      // If parent is also a default entry, we need to convert it first OR use null
      let actualParentId = entry.parentId;

      if (entry.parentId) {
        // Check if parent is a custom entry
        const parentEntry = entries.find(e => e.id === entry.parentId);
        if (parentEntry && !parentEntry.isCustom) {
          // Parent is default - we'll store the synthetic parent ID for now
          // The backend will handle this or we set to null
          actualParentId = null; // Store at root level for now
        } else if (parentEntry && parentEntry.isCustom) {
          // Parent is custom - use its real ID
          actualParentId = parentEntry.id;
        }
      }

      // Create a custom entry copy of this default entry
      // Use sourceId (the original TOC item ID) as the replaceDefaultId
      const res = await fetch(`/api/toc/${trackId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entry.type,
          parentId: actualParentId,
          title: entry.title,
          description: entry.description || null,
          hours: entry.hours || null,
          order: entry.order,
          replaceDefaultId: entry.sourceId || entry.id, // Use sourceId if available, fallback to id
        }),
      });

      if (!res.ok) throw new Error('Failed to make editable');

      onUpdate();
    } catch (error) {
      console.error('Make editable error:', error);
      alert('Failed to make entry editable. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('Title is required');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/toc/entry/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription || null,
            hours: formHours || null,
          }),
        });

        if (!res.ok) throw new Error('Failed to update');
      } else if (addingType) {
        // Create new
        const res = await fetch(`/api/toc/${trackId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: addingType,
            parentId: addingParent,
            title: formTitle,
            description: formDescription || null,
            hours: formHours || null,
            order: 0,
          }),
        });

        if (!res.ok) throw new Error('Failed to create');
      }

      cancelForm();
      onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry and all its children?')) return;

    try {
      const res = await fetch(`/api/toc/entry/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleConvertType = async (entry: TocEntry, targetType: string) => {
    if (!confirm(`Convert "${entry.title}" from ${entry.type} to ${targetType}?`)) return;

    try {
      const res = await fetch(`/api/toc/entry/${entry.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType }),
      });

      if (!res.ok) throw new Error('Failed to convert');

      onUpdate();
    } catch (error) {
      console.error('Convert error:', error);
      alert('Failed to convert type. Please try again.');
    }
  };

  const handleDuplicate = async (entry: TocEntry) => {
    try {
      const res = await fetch(`/api/toc/entry/${entry.id}/duplicate`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to duplicate');

      onUpdate();
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate. Please try again.');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, entry: TocEntry) => {
    setDraggedId(entry.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.id);

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, targetEntry: TocEntry) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === targetEntry.id) return;

    const draggedEntry = entries.find(e => e.id === draggedId);
    if (!draggedEntry) return;

    // Same type and parent only
    if (draggedEntry.type !== targetEntry.type || draggedEntry.parentId !== targetEntry.parentId) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    setDropTargetId(targetEntry.id);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetEntry: TocEntry) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === targetEntry.id) {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    const draggedEntry = entries.find(e => e.id === draggedId);
    if (!draggedEntry) {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    if (draggedEntry.type !== targetEntry.type || draggedEntry.parentId !== targetEntry.parentId) {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    try {
      // If dragged entry is a default, convert it to custom first
      let actualDraggedId = draggedId;
      if (!draggedEntry.isCustom) {
        const res = await fetch(`/api/toc/${trackId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: draggedEntry.type,
            parentId: draggedEntry.parentId,
            title: draggedEntry.title,
            description: draggedEntry.description || null,
            hours: draggedEntry.hours || null,
            order: draggedEntry.order,
            replaceDefaultId: draggedEntry.sourceId || draggedEntry.id,
          }),
        });

        if (!res.ok) throw new Error('Failed to make entry editable');

        const { entry: newEntry } = await res.json();
        actualDraggedId = newEntry.id;

        await onUpdate();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate new order position
      const siblings = entries
        .filter(e =>
          e.type === targetEntry.type &&
          e.parentId === targetEntry.parentId &&
          e.isCustom
        )
        .sort((a, b) => a.order - b.order);

      const targetIndex = siblings.findIndex(s => s.id === targetEntry.id);
      let newOrder: number;

      if (dropPosition === 'before') {
        if (targetIndex === 0) {
          newOrder = targetEntry.order - 1;
        } else {
          const prevSibling = siblings[targetIndex - 1];
          newOrder = (prevSibling.order + targetEntry.order) / 2;
        }
      } else {
        if (targetIndex === siblings.length - 1) {
          newOrder = targetEntry.order + 1;
        } else {
          const nextSibling = siblings[targetIndex + 1];
          newOrder = (targetEntry.order + nextSibling.order) / 2;
        }
      }

      // Update the order
      const res = await fetch(`/api/toc/entry/${actualDraggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!res.ok) throw new Error('Failed to reorder');

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = '✓ Reordered successfully';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);

      onUpdate();
    } catch (error) {
      console.error('Reorder error:', error);
      alert('Failed to reorder. Please try again.');
    } finally {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }

    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  // Arrow button handlers for non-drag reordering
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
    if (currentIndex <= 0) return; // Already at top

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
    if (currentIndex >= siblings.length - 1) return; // Already at bottom

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

  // Build tree
  const buildTree = (entries: TocEntry[]): TocEntry[] => {
    const map = new Map<string, TocEntry>();
    entries.forEach(e => map.set(e.id, { ...e, children: [] }));

    const roots: TocEntry[] = [];

    entries.forEach(e => {
      const node = map.get(e.id)!;
      if (e.parentId) {
        let parent = map.get(e.parentId);

        // If parent doesn't exist in map, it might be a replaced default
        // Try to find the custom entry that replaced it
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
          // Parent not found - add as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort children by order
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

  // Render entry
  const renderEntry = (entry: TocEntry, level: number = 0) => {
    const isExpanded = expandedIds.has(entry.id);
    const hasChildren = entry.children && entry.children.length > 0;
    const isEditing = editingId === entry.id;
    const isDragging = draggedId === entry.id;
    const isDropTarget = dropTargetId === entry.id;
    const showContextMenu = contextMenuId === entry.id;

    const iconComponent = entry.type === 'learningOutcome' ? <Target className="w-4 h-4" /> :
      entry.type === 'topic' ? <Circle className="w-3 h-3" /> :
        entry.type === 'subtopic' ? <Check className="w-3 h-3" /> : <Dot className="w-3 h-3" />;

    let bgColor = entry.isCustom ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50';
    let additionalClasses = '';

    if (isDragging) {
      bgColor = 'bg-violet-500/20 border-violet-500/50';
      additionalClasses = 'opacity-40 scale-95';
    } else if (isDropTarget) {
      if (dropPosition === 'before') {
        bgColor = 'bg-violet-500/10 border-violet-500/30';
        additionalClasses = 'border-t-4 border-t-violet-400 shadow-lg shadow-violet-500/20';
      } else {
        bgColor = 'bg-violet-500/10 border-violet-500/30';
        additionalClasses = 'border-b-4 border-b-violet-400 shadow-lg shadow-violet-500/20';
      }
    }

    return (
      <div key={entry.id} className="mb-1">
        <div
          className={`relative flex items-center gap-2 p-2 rounded-lg border ${bgColor} ${additionalClasses} hover:bg-slate-700/50 transition-all duration-200 ${!isEditing ? 'cursor-move' : ''}`}
          draggable={true}
          onDragStart={(e) => {
            if (isEditing) {
              e.preventDefault();
              return;
            }
            handleDragStart(e, entry);
          }}
          onDragOver={(e) => handleDragOver(e, entry)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, entry)}
          onDragEnd={handleDragEnd}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(entry.id)} className="text-slate-400 hover:text-white text-xs w-4">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {!isEditing && (
            <>
              <span
                className="text-slate-500 cursor-move"
                title={entry.isCustom ? "Drag to reorder" : "Drag to reorder (will make editable)"}
                onMouseDown={(e) => {
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.setAttribute('draggable', 'true');
                  }
                }}
              >
                <GripVertical className="w-4 h-4" />
              </span>

              {/* Arrow buttons for easier reordering */}
              {entry.isCustom && (
                <div className="flex flex-col gap-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(entry);
                    }}
                    className="p-0.5 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Move up"
                  >
                    <ChevronDown className="w-3 h-3 rotate-180" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(entry);
                    }}
                    className="p-0.5 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}

          <span className="text-lg">{iconComponent}</span>

          {isEditing ? (
            <div className="flex-1 flex flex-col gap-2">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Title *"
                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                autoFocus
              />
              {entry.type === 'learningOutcome' && (
                <input
                  type="number"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Hours"
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white w-24"
                />
              )}
            </div>
          ) : (
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{entry.title}</div>
              {entry.hours && <span className="text-xs text-slate-400">{entry.hours}h</span>}
              {entry.isCustom && <span className="ml-2 text-xs text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">Custom</span>}
            </div>
          )}

          <div className="flex items-center gap-1 relative">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="px-2 py-1 text-emerald-400 hover:text-emerald-300 text-sm inline-flex items-center gap-1">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={cancelForm} className="px-2 py-1 text-slate-400 hover:text-white text-sm">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {entry.isCustom && (
                  <>
                    <button onClick={() => startEdit(entry)} className="p-1.5 text-blue-400 hover:text-blue-300 text-sm" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setContextMenuId(showContextMenu ? null : entry.id)}
                      className="p-1.5 text-slate-400 hover:text-white text-sm"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showContextMenu && (
                      <ContextMenu
                        entry={entry}
                        onConvertType={(to) => handleConvertType(entry, to)}
                        onAddItem={() => startAdd('item', entry.id)}
                        onDuplicate={() => handleDuplicate(entry)}
                        onDelete={() => handleDelete(entry.id)}
                        onClose={() => setContextMenuId(null)}
                      />
                    )}
                  </>
                )}
                {!entry.isCustom && (
                  <>
                    <button
                      onClick={() => handleMakeEditable(entry)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
                      title="Convert to custom entry to enable editing"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="text-xs">Make Editable</span>
                    </button>
                    <span className="text-xs text-slate-500 italic px-2">Default</span>
                  </>
                )}
                {entry.type !== 'item' && (
                  <button
                    onClick={() => startAdd(
                      entry.type === 'learningOutcome' ? 'topic' :
                        entry.type === 'topic' ? 'subtopic' : 'item',
                      entry.id
                    )}
                    className="p-1.5 text-violet-400 hover:text-violet-300 text-sm"
                    title="Add child"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 mt-1">
            {entry.children?.map(child => renderEntry(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Edit Table of Contents</h3>
          <p className="text-sm text-slate-400 mt-1">
            View and customize the complete Table of Contents structure. Default curriculum entries are shown in grey (read-only).
            Custom entries appear with a green badge and can be fully edited. Click <Plus className="w-3 h-3 inline" /> next to any entry to add custom sub-entries.
          </p>
        </div>
        <button
          onClick={() => startAdd('learningOutcome')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Learning Outcome
        </button>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 mt-0.5 text-blue-400 shrink-0" />
          <div className="space-y-2 text-sm text-blue-200">
            <p className="font-semibold">How to Edit the Table of Contents</p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <ChevronDown className="w-3 h-3 mt-0.5 shrink-0" />
                <span><strong>Reorder:</strong> Use the up/down arrows or drag entries by the <GripVertical className="w-3 h-3 inline" /> icon</span>
              </li>
              <li className="flex items-start gap-2">
                <Plus className="w-3 h-3 mt-0.5 shrink-0" />
                <span><strong>Add New:</strong> Click <Plus className="w-3 h-3 inline" /> to add Learning Outcomes, Topics, Subtopics, or Items</span>
              </li>
              <li className="flex items-start gap-2">
                <Edit3 className="w-3 h-3 mt-0.5 shrink-0" />
                <span><strong>Edit:</strong> Click "Make Editable" to modify default curriculum entries</span>
              </li>
              <li className="flex items-start gap-2">
                <MoreVertical className="w-3 h-3 mt-0.5 shrink-0" />
                <span><strong>More Actions:</strong> Click <MoreVertical className="w-3 h-3 inline" /> to convert, duplicate, or delete entries</span>
              </li>
            </ul>
            <p className="text-xs mt-2 text-blue-300/70">💡 All changes sync automatically to the Content tab</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {addingType && !editingId && (
        <div className="p-4 bg-slate-800 border-2 border-violet-500/30 rounded-xl space-y-3 shadow-lg shadow-violet-500/10">
          <h4 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add {addingType === 'learningOutcome' ? 'Learning Outcome' :
              addingType === 'topic' ? 'Topic' :
                addingType === 'subtopic' ? 'Subtopic' : 'Item'}
          </h4>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Title *"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            autoFocus
          />
          {addingType === 'learningOutcome' && (
            <input
              type="number"
              value={formHours}
              onChange={(e) => setFormHours(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Learning hours (optional)"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            />
          )}
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition"
            >
              Save
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOC Tree */}
      <div className="space-y-1 pb-20">
        {tree.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No TOC entries yet.</p>
            <p className="text-sm text-slate-500">Default curriculum entries are shown below. Click "Make Editable" on any entry to start customizing.</p>
          </div>
        ) : (
          <>
            {tree.map(entry => renderEntry(entry))}

            {/* Show a message if only defaults are visible */}
            {tree.every(e => !e.isCustom) && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-200">
                  <strong>Note:</strong> These are default curriculum entries from the parser.
                  To edit, reorder, or add children, click "Make Editable" first to convert them to custom entries.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Click outside to close context menu */}
      {contextMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenuId(null)}
        />
      )}
    </div>
  );
}
