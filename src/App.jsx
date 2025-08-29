import React, { useCallback, useEffect, useState } from "react";
import Editor from "./components/Editor";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import PreviewPane from "./components/PreviewPane";
import ClauseLibrary from "./components/ClauseLibrary";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import { handleVoiceCommand } from "./utils/commandHandler";

export default function App() {
  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState("<p></p>");
  const [clOpen, setClOpen] = useState(false);
  const [voiceClause, setVoiceClause] = useState("");
  const [activeId, setActiveId] = useState(null);

  // Keep preview HTML + active delta in sync
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      window.__ACTIVE_DELTA__ = editor.getContents();
      setHtml(editor.root.innerHTML);
    };
    editor.on("text-change", sync);
    sync();
    return () => editor.off("text-change", sync);
  }, [editor]);

  // Helper for Sidebar to save active draft
  const getActive = () => {
    if (!editor) return { id: activeId, title: "Untitled", delta: null, html: "" };
    const delta = editor.getContents();
    const html = editor.root.innerHTML;
    const title = (editor.getText() || "").slice(0, 40).trim() || "Untitled";
    return { id: activeId, title, delta, html, setId: setActiveId };
  };

  // Dictation: plain text
  const onText = useCallback((text) => {
    if (!editor) return;
    const sel = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
    editor.insertText(sel.index, text);
    editor.setSelection(sel.index + text.length);
  }, [editor]);

  // Dictation: route to the unified handler; it returns true/false
  const onCommand = useCallback((cmdId, raw) => {
    if (!editor) return false;
    return handleVoiceCommand(editor, cmdId, raw, { setVoiceClause, setClOpen });
  }, [editor]);

  const { listening, toggle } = useSpeechRecognition({ onText, onCommand });

  // Load a saved draft (from Sidebar)
  const loadDraft = useCallback((d) => {
    if (!editor || !d) return;
    setActiveId(d.id);
    editor.setContents(d.delta);
  }, [editor]);

  // Listen for “open clause library” button in TopBar
  useEffect(() => {
    const open = () => setClOpen(true);
    window.addEventListener("open-clause-library", open);
    return () => window.removeEventListener("open-clause-library", open);
  }, []);

  // Listen for programmatic template apply events (from voice)
  useEffect(() => {
    const makeHandler = (key) => () => {
      const e = new CustomEvent("topbar-apply", { detail: key });
      window.dispatchEvent(e);
    };
    const specs = ["petition", "affidavit", "notice"].map((k) => {
      const fn = makeHandler(k);
      window.addEventListener("apply-template-" + k, fn);
      return { k, fn };
    });
    return () => specs.forEach(({ k, fn }) => window.removeEventListener("apply-template-" + k, fn));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar onLoad={loadDraft} onMicClick={toggle} listening={listening} getActive={getActive} />
        <div className="flex-1 flex flex-col">
          <TopBar editor={editor} />
          <div className="flex flex-1">
            <div className="flex-1 p-4">
              <Editor onReady={setEditor} />
            </div>
            <PreviewPane html={html} />
          </div>
        </div>
      </div>

      <ClauseLibrary
        editor={editor}
        open={clOpen}
        onClose={() => { setClOpen(false); setVoiceClause(""); }}
        voiceQuery={voiceClause}
      />
    </div>
  );
}
