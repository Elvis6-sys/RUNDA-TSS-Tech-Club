"use client";

/**
 * RichTextEditor — full Word-style WYSIWYG editor.
 *
 * All toolbar actions work via execCommand (with fallbacks for
 * font-size / color which we apply via Selection + Range API directly).
 *
 * Saves as clean HTML. Renders identically on student side.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function cmd(command: string, value?: string): boolean {
  return document.execCommand(command, false, value ?? undefined);
}

function queryState(command: string): boolean {
  try { return document.queryCommandState(command); } catch { return false; }
}

function queryValue(command: string): string {
  try { return document.queryCommandValue(command); } catch { return ""; }
}

// Wrap selected text in a <span> with given inline style property
function wrapSelectionWithStyle(prop: string, value: string): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.style.setProperty(prop, value);
  try {
    range.surroundContents(span);
  } catch {
    // selection spans multiple elements — extract + re-wrap
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);
}

// Insert HTML at cursor
function insertHtmlAtCursor(html: string): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const div = document.createElement("div");
  div.innerHTML = html;
  const frag = document.createDocumentFragment();
  let lastNode: Node | null = null;
  while (div.firstChild) {
    lastNode = frag.appendChild(div.firstChild);
  }
  range.insertNode(frag);
  if (lastNode) {
    const r = document.createRange();
    r.setStartAfter(lastNode);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

// ─── Toolbar atom ─────────────────────────────────────────────────────────────

function Btn({
  title, active, onClick, children, wide,
}: {
  title: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(e); }}
      className={`
        inline-flex items-center justify-center h-8 px-1.5 rounded transition-all text-xs border select-none
        ${wide ? "min-w-[42px]" : "min-w-[30px]"}
        ${active
          ? "bg-sky-100 border-sky-400 text-sky-900 shadow-inner"
          : "border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-300"}
        cursor-pointer
      `}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="self-stretch w-px bg-slate-200 my-1 mx-0.5" />;
}

function GroupLabel({ children }: { children: string }) {
  return <p className="text-[9px] text-slate-400 text-center mt-0.5 select-none leading-none">{children}</p>;
}

// ─── Font options ─────────────────────────────────────────────────────────────

const FONTS = [
  "Default",
  "Arial", "Calibri", "Cambria", "Comic Sans MS", "Consolas",
  "Courier New", "Georgia", "Impact",
  "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS",
  "Verdana",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 60, 72];

// execCommand fontSize maps 1-7 to ~7 sizes only.
// We apply font-size directly via span wrapping instead.

const COLORS = [
  "#000000", "#1e293b", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6", "#ffffff",
  "#7f1d1d", "#991b1b", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#fff1f2",
  "#713f12", "#92400e", "#d97706", "#f59e0b", "#fcd34d", "#fde68a", "#fef3c7", "#fffbeb",
  "#14532d", "#166534", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#f0fdf4",
  "#0c4a6e", "#075985", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#f0f9ff",
  "#312e81", "#3730a3", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#eef2ff",
  "#4a044e", "#6b21a8", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#f5f3ff",
];

const HIGHLIGHTS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff69b4", "#ffa500",
  "#ff0000", "#800080", "#0000ff", "#006400", "#00008b",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);          // force re-render for toolbar state
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Default");
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const lastHtml = useRef(value);
  const initialised = useRef(false);

  // Seed content once
  useEffect(() => {
    if (initialised.current || !editorRef.current) return;
    initialised.current = true;
    editorRef.current.innerHTML = value ?? "";
  }, []); // eslint-disable-line

  // Sync when parent resets (e.g. switching blocks)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastHtml.current) {
      editorRef.current.innerHTML = value ?? "";
      lastHtml.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastHtml.current = html;
    onChange(html);
    setTick(n => n + 1);
  }, [onChange]);

  // ── apply font size directly via span ──────────────────────────────────────
  const applyFontSize = useCallback((px: number) => {
    setFontSize(px);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      // No selection — just update the font size variable for future typing
      wrapSelectionWithStyle("font-size", `${px}px`);
    } else {
      wrapSelectionWithStyle("font-size", `${px}px`);
    }
    emit();
  }, [emit]);

  // ── apply font family ──────────────────────────────────────────────────────
  const applyFontFamily = useCallback((family: string) => {
    setFontFamily(family);
    setShowFontMenu(false);
    editorRef.current?.focus();
    if (family === "Default") {
      cmd("fontName", "inherit");
    } else {
      cmd("fontName", family);
    }
    emit();
  }, [emit]);

  // ── text colour ─────────────────────────────────────────────────────────────
  const applyColor = useCallback((color: string) => {
    setShowColorPicker(false);
    editorRef.current?.focus();
    cmd("foreColor", color);
    emit();
  }, [emit]);

  // ── highlight ───────────────────────────────────────────────────────────────
  const applyHighlight = useCallback((color: string) => {
    setShowHighlightPicker(false);
    editorRef.current?.focus();
    // hiliteColor is the standard; backColor is IE fallback
    cmd("hiliteColor", color) || cmd("backColor", color);
    emit();
  }, [emit]);

  // ── insert table ────────────────────────────────────────────────────────────
  const insertTable = useCallback(() => {
    const rows = parseInt(prompt("Number of rows:", "3") ?? "0");
    const cols = parseInt(prompt("Number of columns:", "3") ?? "0");
    if (!rows || !cols) return;
    let html = '<table style="width:100%;border-collapse:collapse;">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? "th" : "td";
        const style = r === 0
          ? 'style="padding:6px 12px;border:1px solid #cbd5e1;background:#f1f5f9;font-weight:bold;text-align:left;"'
          : 'style="padding:6px 12px;border:1px solid #cbd5e1;"';
        html += `<${tag} ${style}>${r === 0 ? `Header ${c + 1}` : "Cell"}</${tag}>`;
      }
      html += "</tr>";
    }
    html += "</table><br>";
    editorRef.current?.focus();
    insertHtmlAtCursor(html);
    emit();
  }, [emit]);

  // ── format block (heading / paragraph) ─────────────────────────────────────
  const applyBlock = useCallback((tag: string) => {
    editorRef.current?.focus();
    cmd("formatBlock", tag);
    emit();
  }, [emit]);

  // ─── toolbar state ─────────────────────────────────────────────────────────
  const bold = queryState("bold");
  const italic = queryState("italic");
  const underline = queryState("underline");
  const strike = queryState("strikeThrough");
  const ul = queryState("insertUnorderedList");
  const ol = queryState("insertOrderedList");

  return (
    <div className="flex flex-col border border-slate-300 rounded-xl overflow-hidden shadow bg-white"
      onMouseDown={() => setTimeout(() => setTick(n => n + 1), 0)}>

      {/* ── Word-style tab bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 border-b border-slate-200 px-3 pt-1">
        {["Home", "Insert", "Format"].map(t => (
          <button key={t} type="button"
            className="px-3 py-1 text-xs font-medium text-slate-600 rounded-t hover:bg-white hover:shadow-sm transition border border-transparent hover:border-slate-200">
            {t}
          </button>
        ))}
      </div>

      {/* ── Ribbon ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#f8f8f8] to-[#f0f0f0] border-b border-slate-200 px-2 py-1">
        <div className="flex items-stretch gap-0 flex-wrap">

          {/* ── Undo / Redo ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Btn title="Undo (Ctrl+Z)" onClick={() => { editorRef.current?.focus(); cmd("undo"); emit(); }}>↩</Btn>
              <Btn title="Redo (Ctrl+Y)" onClick={() => { editorRef.current?.focus(); cmd("redo"); emit(); }}>↪</Btn>
            </div>
            <GroupLabel>History</GroupLabel>
          </div>
          <Sep />

          {/* ── Font family ── */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <button type="button"
                onMouseDown={e => { e.preventDefault(); setShowFontMenu(f => !f); setShowColorPicker(false); setShowHighlightPicker(false); }}
                className="flex items-center gap-1 h-8 px-2 rounded border border-slate-300 bg-white hover:border-sky-400 text-xs text-slate-800 w-[140px] justify-between shadow-sm">
                <span className="truncate text-slate-800" style={{ fontFamily: fontFamily === "Default" ? "inherit" : fontFamily }}>
                  {fontFamily}
                </span>
                <span className="text-[8px] text-slate-500 shrink-0">▼</span>
              </button>
              {showFontMenu && (
                <div className="absolute top-full left-0 z-50 mt-0.5 w-48 rounded border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto">
                  {FONTS.map(f => (
                    <button key={f} type="button"
                      onMouseDown={e => { e.preventDefault(); applyFontFamily(f); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-slate-800 hover:bg-sky-50 hover:text-sky-700 transition"
                      style={{ fontFamily: f === "Default" ? "inherit" : f }}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <GroupLabel>Font</GroupLabel>
          </div>
          <div className="w-1" />

          {/* ── Font size ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <button type="button" title="Decrease font size"
                onMouseDown={e => { e.preventDefault(); const i = FONT_SIZES.indexOf(fontSize); if (i > 0) applyFontSize(FONT_SIZES[i - 1]); }}
                className="w-7 h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                A↓
              </button>
              <select
                value={fontSize}
                onMouseDown={e => e.stopPropagation()}
                onChange={e => applyFontSize(Number(e.target.value))}
                className="w-14 h-8 rounded border border-slate-300 bg-white text-center text-xs text-slate-700 focus:outline-none focus:border-sky-400 shadow-sm"
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" title="Increase font size"
                onMouseDown={e => { e.preventDefault(); const i = FONT_SIZES.indexOf(fontSize); if (i < FONT_SIZES.length - 1) applyFontSize(FONT_SIZES[i + 1]); }}
                className="w-7 h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                A↑
              </button>
            </div>
            <GroupLabel>Size</GroupLabel>
          </div>
          <Sep />

          {/* ── Bold / Italic / Underline / Strike ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Btn title="Bold (Ctrl+B)" active={bold} onClick={() => { editorRef.current?.focus(); cmd("bold"); emit(); }}>
                <strong className="text-sm">B</strong>
              </Btn>
              <Btn title="Italic (Ctrl+I)" active={italic} onClick={() => { editorRef.current?.focus(); cmd("italic"); emit(); }}>
                <em className="text-sm font-bold">I</em>
              </Btn>
              <Btn title="Underline (Ctrl+U)" active={underline} onClick={() => { editorRef.current?.focus(); cmd("underline"); emit(); }}>
                <span className="text-sm font-bold underline">U</span>
              </Btn>
              <Btn title="Strikethrough" active={strike} onClick={() => { editorRef.current?.focus(); cmd("strikeThrough"); emit(); }}>
                <span className="text-sm font-bold line-through">S</span>
              </Btn>
              <Btn title="Superscript" onClick={() => { editorRef.current?.focus(); cmd("superscript"); emit(); }}>
                X<sup className="text-[7px]">2</sup>
              </Btn>
              <Btn title="Subscript" onClick={() => { editorRef.current?.focus(); cmd("subscript"); emit(); }}>
                X<sub className="text-[7px]">2</sub>
              </Btn>
            </div>
            <GroupLabel>Style</GroupLabel>
          </div>
          <Sep />

          {/* ── Text colour ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 relative">
              {/* Color button */}
              <div className="relative">
                <button type="button" title="Text Color"
                  onMouseDown={e => { e.preventDefault(); setShowColorPicker(p => !p); setShowHighlightPicker(false); setShowFontMenu(false); }}
                  className="flex flex-col items-center justify-center w-9 h-8 rounded border border-transparent hover:border-slate-300 hover:bg-slate-100 transition gap-0 px-1">
                  <span className="text-sm font-extrabold text-slate-800 leading-none">A</span>
                  <div className="w-6 h-1.5 rounded-sm mt-0.5" style={{ background: "#ff0000" }} />
                  <span className="text-[8px] text-slate-400">▼</span>
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 z-50 mt-0.5 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 w-52"
                    onMouseLeave={() => setShowColorPicker(false)}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Text Color</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {COLORS.map(c => (
                        <button key={c} type="button"
                          onMouseDown={e => { e.preventDefault(); applyColor(c); }}
                          className="w-5 h-5 rounded border border-slate-200 hover:scale-125 transition-transform"
                          style={{ background: c }} title={c} />
                      ))}
                    </div>
                    <label className="flex items-center gap-1.5 mt-2 text-xs text-sky-600 cursor-pointer hover:underline">
                      <input type="color" className="w-4 h-4 cursor-pointer rounded"
                        onChange={e => applyColor(e.target.value)} />
                      Custom color…
                    </label>
                  </div>
                )}
              </div>
              {/* Highlight button */}
              <div className="relative">
                <button type="button" title="Text Highlight"
                  onMouseDown={e => { e.preventDefault(); setShowHighlightPicker(p => !p); setShowColorPicker(false); setShowFontMenu(false); }}
                  className="flex flex-col items-center justify-center w-9 h-8 rounded border border-transparent hover:border-slate-300 hover:bg-slate-100 transition gap-0 px-1">
                  <span className="text-xs font-extrabold text-slate-800 leading-none" style={{ background: "#ffff00", padding: "0 2px" }}>ab</span>
                  <div className="w-6 h-1.5 rounded-sm mt-0.5" style={{ background: "#ffff00" }} />
                  <span className="text-[8px] text-slate-400">▼</span>
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-full left-0 z-50 mt-0.5 bg-white border border-slate-200 rounded-xl shadow-2xl p-3"
                    onMouseLeave={() => setShowHighlightPicker(false)}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Highlight</p>
                    <div className="flex flex-wrap gap-0.5 w-32">
                      {HIGHLIGHTS.map(c => (
                        <button key={c} type="button"
                          onMouseDown={e => { e.preventDefault(); applyHighlight(c); }}
                          className="w-6 h-6 rounded border border-slate-300 hover:scale-125 transition-transform"
                          style={{ background: c }} title={c} />
                      ))}
                      <button type="button"
                        onMouseDown={e => { e.preventDefault(); applyHighlight("transparent"); }}
                        className="w-full text-[10px] text-sky-600 mt-1 hover:underline text-left">
                        No highlight
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Clear formatting */}
              <Btn title="Clear Formatting" onClick={() => { editorRef.current?.focus(); cmd("removeFormat"); emit(); }}>
                <span className="font-mono text-xs">Ⅹ<sub className="text-[7px]">a</sub></span>
              </Btn>
            </div>
            <GroupLabel>Color</GroupLabel>
          </div>
          <Sep />

          {/* ── Paragraph style ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <select
                onMouseDown={e => e.stopPropagation()}
                onChange={e => { applyBlock(e.target.value); e.target.value = ""; }}
                defaultValue=""
                className="h-8 px-1.5 rounded border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:border-sky-400 shadow-sm"
              >
                <option value="" disabled>Paragraph style</option>
                <option value="p">Normal text</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="h5">Heading 5</option>
                <option value="h6">Heading 6</option>
                <option value="pre">Preformatted</option>
                <option value="blockquote">Quote</option>
              </select>
            </div>
            <GroupLabel>Paragraph</GroupLabel>
          </div>
          <Sep />

          {/* ── Alignment ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Btn title="Align Left" active={queryState("justifyLeft")} onClick={() => { editorRef.current?.focus(); cmd("justifyLeft"); emit(); }}>
                <span className="text-base">⬛</span>
              </Btn>
              <Btn title="Center" active={queryState("justifyCenter")} onClick={() => { editorRef.current?.focus(); cmd("justifyCenter"); emit(); }}>
                <span className="text-base">☰</span>
              </Btn>
              <Btn title="Align Right" active={queryState("justifyRight")} onClick={() => { editorRef.current?.focus(); cmd("justifyRight"); emit(); }}>
                <span className="text-base">⬜</span>
              </Btn>
              <Btn title="Justify" active={queryState("justifyFull")} onClick={() => { editorRef.current?.focus(); cmd("justifyFull"); emit(); }}>
                <span className="text-base">≡</span>
              </Btn>
            </div>
            <GroupLabel>Align</GroupLabel>
          </div>
          <Sep />

          {/* ── Lists + Indent ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Btn title="Bullet List" active={ul} onClick={() => { editorRef.current?.focus(); cmd("insertUnorderedList"); emit(); }}>
                <span className="text-sm">•≡</span>
              </Btn>
              <Btn title="Numbered List" active={ol} onClick={() => { editorRef.current?.focus(); cmd("insertOrderedList"); emit(); }}>
                <span className="text-sm">1≡</span>
              </Btn>
              <Btn title="Increase Indent" onClick={() => { editorRef.current?.focus(); cmd("indent"); emit(); }}>→</Btn>
              <Btn title="Decrease Indent" onClick={() => { editorRef.current?.focus(); cmd("outdent"); emit(); }}>←</Btn>
            </div>
            <GroupLabel>List</GroupLabel>
          </div>
          <Sep />

          {/* ── Insert ── */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Btn title="Insert Link" wide onClick={() => {
                editorRef.current?.focus();
                const url = prompt("URL:", "https://");
                if (url) cmd("createLink", url);
                emit();
              }}>
                🔗
              </Btn>
              <Btn title="Remove Link" onClick={() => { editorRef.current?.focus(); cmd("unlink"); emit(); }}>
                <span className="line-through text-xs">🔗</span>
              </Btn>
              <Btn title="Insert Horizontal Line" onClick={() => { editorRef.current?.focus(); cmd("insertHorizontalRule"); emit(); }}>
                ─
              </Btn>
              <Btn title="Insert Table" wide onClick={insertTable}>⊞</Btn>
              <Btn title="Insert Image URL" wide onClick={() => {
                const url = prompt("Image URL:");
                if (!url) return;
                const alt = prompt("Alt text:", "Image") ?? "Image";
                editorRef.current?.focus();
                cmd("insertHTML", `<img src="${url}" alt="${alt}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
                emit();
              }}>
                🖼️
              </Btn>
            </div>
            <GroupLabel>Insert</GroupLabel>
          </div>
        </div>
      </div>

      {/* ── Page / editor area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-6 min-h-[360px]">
        {/* Dark page — matches the student card background exactly */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              cmd("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
              emit();
            }
          }}
          className="
            bg-slate-800/60 border border-slate-700/70 rounded-2xl
            mx-auto shadow-lg
            px-8 py-8 outline-none min-h-[360px]
            text-slate-200 text-[14px] leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:leading-tight
            [&_h2]:text-2xl [&_h2]:font-bold   [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-slate-600
            [&_h3]:text-xl  [&_h3]:font-bold   [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-slate-200 [&_h4]:mt-3 [&_h4]:mb-1
            [&_h5]:text-sm  [&_h5]:font-semibold [&_h5]:text-slate-200 [&_h5]:mt-2 [&_h5]:mb-1
            [&_p]:my-2 [&_p]:text-slate-300
            [&_ul]:pl-7 [&_ul]:my-2 [&_ul]:list-disc  [&_ul]:text-slate-300
            [&_ol]:pl-7 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:text-slate-300
            [&_li]:my-0.5 [&_li]:text-slate-300
            [&_blockquote]:border-l-4 [&_blockquote]:border-sky-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_blockquote]:my-3 [&_blockquote]:bg-sky-500/5 [&_blockquote]:py-1 [&_blockquote]:rounded-r-xl
            [&_pre]:bg-slate-950 [&_pre]:text-emerald-300 [&_pre]:rounded-xl [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
            [&_code]:bg-slate-700 [&_code]:text-sky-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
            [&_a]:text-sky-400 [&_a]:underline [&_a]:hover:text-sky-300
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-sm
            [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-slate-600 [&_th]:bg-slate-700 [&_th]:font-bold [&_th]:text-left [&_th]:text-white
            [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-slate-600 [&_td]:text-slate-300
            [&_tr:hover]:bg-slate-700/40
            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2
            [&_hr]:border-slate-600 [&_hr]:my-4
            focus:ring-0 caret-white selection:bg-sky-500/40
          "
          style={{ fontFamily: "'Calibri','Segoe UI',sans-serif", maxWidth: 794 }}
        />
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1 bg-slate-900 border-t border-slate-700 text-[10px] text-slate-400">
        <span>Text / Markdown editor</span>
        <span>{editorRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length ?? 0} words</span>
      </div>
    </div>
  );
}
