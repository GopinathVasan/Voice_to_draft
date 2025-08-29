import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const Font = Quill.import("formats/font");
Font.whitelist = ["sans-serif","serif","monospace","latha"]; // if system font available
Quill.register(Font, true);

export default function Editor({ onReady }) {
  const ref = useRef(null);
  const quillRef = useRef(null);

   useEffect(() => {
    quillRef.current = new Quill(ref.current, {
      theme: "snow",
      placeholder: "Dictate Tamil…",
      modules: {
        toolbar: false,              // custom toolbar
        history: { delay: 500, maxStack: 200, userOnly: true },
        keyboard: { bindings: {} },
      },formats: [
        "bold", "italic", "underline",
        "list", "align",
        "size", "font",
      ],
    });

    const saved = localStorage.getItem("activeDraft");
    if (saved) {
      const d = JSON.parse(saved);
      if (d.delta) quillRef.current.setContents(d.delta);
    }

    const iv = setInterval(() => {
      const delta = quillRef.current.getContents();
      const html = quillRef.current.root.innerHTML;
      const title = (quillRef.current.getText() || "").slice(0, 30).trim() || "Untitled";
      localStorage.setItem("activeDraft", JSON.stringify({ title, delta, html, updatedAt: Date.now() }));
    }, 3000);

    onReady && onReady(quillRef.current);
    return () => clearInterval(iv);
  }, [onReady]);

  return <div id="editor" ref={ref} className="h-[560px] overflow-auto rounded border bg-white" />;
}
