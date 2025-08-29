import React, { useCallback, useEffect, useState } from "react";
import Editor from "./components/Editor";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import PreviewPane from "./components/PreviewPane";
import ClauseLibrary from "./components/ClauseLibrary";
import useSpeechRecognition from "./hooks/useSpeechRecognition";

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
  const onText = useCallback(
    (text) => {
      if (!editor) return;
      const sel = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
      editor.insertText(sel.index, text);
      editor.setSelection(sel.index + text.length);
    },
    [editor]
  );

  // Dictation: commands + voice clause trigger
  const onCommand = useCallback(
    (cmd, raw) => {
      if (!editor) return;

      // Voice clause trigger
      const ta = raw?.match(/கிளாஸ்\s+சேர்\s+(.+)/i) || raw?.match(/கிளாஸ்\s+சேர்க்கவும்\s+(.+)/i);
      const en = raw?.toLowerCase().match(/add\s+clause\s+(.+)/i);
      const m = ta || en;
      if (m && m[1]) {
        setVoiceClause(m[1].trim());
        setClOpen(true);
        return;
      }

      const sel = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
      const insert = (t) => {
        editor.insertText(sel.index, t);
        editor.setSelection(sel.index + t.length);
      };

      switch (cmd) {
        case "new line":
        case "புதிய வரி":
          insert("\n");
          break;
        case "new paragraph":
        case "புதிய பதிவை":
        case "புதிய பதிவு":
        case "புதிய பத்தி":
          insert("\n\n");
          break;
        case "bold":
        case "தடித்த":
          editor.format("bold", true);
          break;
        case "italic":
        case "சாய்வு":
          editor.format("italic", true);
          break;
        case "underline":
        case "அடிக்கோடு":
          editor.format("underline", true);
          break;
        case "insert date":
        case "தேதி சேர்":
        case "தேதி சேர்க்கவும்": {
          const d = new Date().toLocaleDateString("ta-IN");
          insert(d + " ");
          break;
        }
        case "heading one":
        case "தலைப்பு ஒன்று":
          editor.format("size", "huge");
          editor.format("bold", true);
          break;
        case "heading two":
        case "தலைப்பு இரண்டு":
          editor.format("size", "large");
          editor.format("bold", true);
          break;
        case "numbered list":
        case "எண்கள் பட்டியல்":
          editor.format("list", "ordered");
          break;
        case "bullet list":
        case "புள்ளி பட்டியல்":
          editor.format("list", "bullet");
          break;

        // Voice template names
        case "petition template":
        case "affidavit template":
        case "notice template":
        case "மனு டெம்ப்ளேட்": {
          const map = {
            "petition template": "petition",
            "affidavit template": "affidavit",
            "notice template": "notice",
            "மனு டெம்ப்ளேட்": "petition",
          };
          const key = map[cmd] || "petition";
          const evt = new Event("apply-template-" + key);
          window.dispatchEvent(evt);
          break;
        }

        default:
          break;
      }
    },
    [editor]
  );

  const { listening, toggle } = useSpeechRecognition({ onText, onCommand });

  const loadDraft = useCallback(
    (d) => {
      if (!editor || !d) return;
      setActiveId(d.id);
      editor.setContents(d.delta);
    },
    [editor]
  );

  // Listen for TopBar + Clause Library events
  useEffect(() => {
    const open = () => setClOpen(true);
    window.addEventListener("open-clause-library", open);
    return () => window.removeEventListener("open-clause-library", open);
  }, []);

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
        onClose={() => {
          setClOpen(false);
          setVoiceClause("");
        }}
        voiceQuery={voiceClause}
      />
    </div>
  );
}
