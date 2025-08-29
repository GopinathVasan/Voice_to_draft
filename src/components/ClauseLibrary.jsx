import React, { useMemo, useState } from "react";
import CLAUSES from "../data/clauses";
import { bestMatch } from "../utils/nlp";

export default function ClauseLibrary({ editor, open, onClose, voiceQuery }) {
  const [q, setQ] = useState("");

  React.useEffect(() => {
    if (!voiceQuery || !editor) return;
    const flat = CLAUSES.flatMap(cat =>
      cat.items.map(item => ({ ...item, category: cat.category }))
    );
    const exact = flat.find(i => i.title.toLowerCase() === voiceQuery.toLowerCase());
    const target = exact || flat.find(i => bestMatch(voiceQuery, [i.title], 3));
    if (target) {
      insertClause(editor, target.text);
      onClose?.();
    }
  }, [voiceQuery, editor, onClose]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return CLAUSES;
    return CLAUSES.map(cat => ({
      ...cat,
      items: cat.items.filter(
        i =>
          i.title.toLowerCase().includes(qq) ||
          i.text.toLowerCase().includes(qq)
      ),
    })).filter(cat => cat.items.length);
  }, [q]);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l shadow-xl transition-transform ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b flex items-center gap-2">
        <div className="font-semibold text-lg">Clause Library</div>
        <button onClick={onClose} className="ml-auto px-2 py-1 rounded border">
          ✕
        </button>
      </div>

      <div className="p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (e.g., property, notice, ஒப்பந்தம்)"
          className="w-full border rounded px-3 py-2 mb-3"
        />
        <div className="space-y-4 overflow-auto h-[70vh] pr-1">
          {filtered.map((cat) => (
            <div key={cat.category}>
              <div className="text-sm font-semibold text-gray-600 mb-1">
                {cat.category}
              </div>
              <div className="space-y-2">
                {cat.items.map((i, idx) => (
                  <div key={idx} className="border rounded p-2">
                    <div className="font-medium">{i.title}</div>
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {i.text}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => insertClause(editor, i.text)}
                        className="px-3 py-1 rounded bg-gray-900 text-white"
                      >
                        Insert
                      </button>
                      {i.placeholders?.length ? (
                        <span className="text-xs text-gray-500">
                          Fields: {i.placeholders.join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="text-sm text-gray-500">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}

function insertClause(editor, text) {
  if (!editor) return;
  const sel =
    editor.getSelection(true) || { index: editor.getLength(), length: 0 };
  editor.insertText(sel.index, text + "\n");
  editor.setSelection(sel.index + text.length + 1, 0);
}
