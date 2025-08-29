import React, { useEffect, useState } from "react";
import { insertTemplate, TEMPLATES } from "../utils/templateManager";
import { selectNextPlaceholder, selectPrevPlaceholder } from "../utils/placeholders";
import {
  goToLine,
  deleteLine,
  insertBlankLineAfter,
  insertBlankLineBefore,
  selectLine, // ✅ you were using it but not importing
} from "../utils/lines";

const Btn = ({ active, children, onClick, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-md border text-sm
      ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100 border-gray-300"}
    `}
  >
    {children}
  </button>
);

export default function TopBar({ editor }) {
  const [fmt, setFmt] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: "",
    list: "",
    size: "",
    font: "",
  });

  // ✅ Safe sync with selection/text changes (no crash when range is null)
  useEffect(() => {
    if (!editor) return;

    const readFormats = () => {
      const range = editor.getSelection(); // may be null when blurred
      if (!range) { setFmt({}); return; }
      const f = editor.getFormat(range);   // pass range explicitly
      setFmt(f || {});
    };

    const onSel = (range /*, oldRange, source*/) => {
      if (!range) { setFmt({}); return; }
      const f = editor.getFormat(range);
      setFmt(f || {});
    };

    const onText = () => readFormats();

    editor.on("selection-change", onSel);
    editor.on("text-change", onText);
    readFormats();

    return () => {
      editor.off("selection-change", onSel);
      editor.off("text-change", onText);
    };
  }, [editor]);

  // formatting helpers
  const apply = (prop, val = true) => editor && editor.format(prop, val);
  const applyAlign = (v) => editor && editor.format("align", v || false);
  const applyList  = (v) => editor && editor.format("list", v);

  // sizes: Quill semantic sizes
  const setSize = (v) => editor && editor.format("size", v || false);
  const setFont = (v) => editor && editor.format("font", v || false);

  // history
  const undo = () => editor?.history?.undo?.();
  const redo = () => editor?.history?.redo?.();

  const applyTemplate = (key) => insertTemplate(editor, key);

  const handleGoto = () => {
    const val = window.prompt("Go to line #");
    if (!val) return;
    const n = parseInt(val, 10);
    if (!Number.isNaN(n) && n > 0) goToLine(editor, n);
  };

  return (
    <div className="w-full border-b bg-white px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
      {/* Templates */}
      <select
        onChange={(e) => e.target.value && applyTemplate(e.target.value)}
        className="px-2 py-1.5 rounded-md border bg-white"
        title="Insert template"
      >
        <option value="">📄 Template</option>
        {Object.keys(TEMPLATES).map((k) => (
          <option key={k} value={k}>{k[0].toUpperCase()+k.slice(1)}</option>
        ))}
      </select>

      {/* Font & Size */}
      <select
        value={fmt.font || ""}
        onChange={(e) => setFont(e.target.value)}
        className="px-2 py-1.5 rounded-md border bg-white"
        title="Font"
      >
        <option value="">Default</option>
        <option value="latha">Latha</option>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans</option>
        <option value="monospace">Mono</option>
      </select>

      <select
        value={fmt.size || ""}
        onChange={(e) => setSize(e.target.value || false)}
        className="px-2 py-1.5 rounded-md border bg-white"
        title="Font size"
      >
        {/* Quill semantic sizes */}
        <option value="">12</option>
        <option value="large">14</option>
        <option value="huge">18</option>
      </select>

      {/* Undo/Redo */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn onClick={undo} title="Undo">↶</Btn>
      <Btn onClick={redo} title="Redo">↷</Btn>

      {/* B I U */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn active={!!fmt.bold} onClick={() => apply("bold")} title="Bold">B</Btn>
      <Btn active={!!fmt.italic} onClick={() => apply("italic")} title="Italic">
        <span style={{ fontStyle: "italic" }}>I</span>
      </Btn>
      <Btn active={!!fmt.underline} onClick={() => apply("underline")} title="Underline">
        <span style={{ textDecoration: "underline" }}>U</span>
      </Btn>

      {/* Align */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn active={!fmt.align} onClick={() => applyAlign("")} title="Align left">⟸</Btn>
      <Btn active={fmt.align === "center"} onClick={() => applyAlign("center")} title="Align center">≡</Btn>
      <Btn active={fmt.align === "right"} onClick={() => applyAlign("right")} title="Align right">⟹</Btn>

      {/* Lists */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn active={fmt.list === "ordered"} onClick={() => applyList("ordered")} title="Numbered list">1.</Btn>
      <Btn active={fmt.list === "bullet"} onClick={() => applyList("bullet")} title="Bullet list">•</Btn>

      {/* Placeholder Nav */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn onClick={() => selectPrevPlaceholder(editor)} title="Previous placeholder">⏮</Btn>
      <Btn onClick={() => selectNextPlaceholder(editor)} title="Next placeholder">⏭</Btn>

      {/* Quick line helpers */}
      <div className="mx-2 h-5 w-px bg-gray-300" />
      <Btn onClick={() => insertBlankLineBefore(editor, null)} title="Insert line before">＋↑</Btn>
      <Btn onClick={() => insertBlankLineAfter(editor, null)} title="Insert line after">＋↓</Btn>
      <Btn onClick={() => deleteLine(editor, null)} title="Delete current line">🗑</Btn>
      <Btn onClick={handleGoto} title="Go to line">Go to #</Btn>
      <Btn onClick={() => selectLine(editor, null)} title="Select current line">Select Line</Btn>
    </div>
  );
}
