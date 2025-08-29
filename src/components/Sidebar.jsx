import React, { useEffect, useState } from "react";
import { listDrafts, saveDraft as dbSave, loadDraft as dbLoad, deleteDraft as dbDelete } from "../hooks/useDraftsDB";

export default function Sidebar({ onLoad, onMicClick, listening, getActive }) {
  const [drafts, setDrafts] = useState([]);

  const refresh = async () => setDrafts(await listDrafts());

  useEffect(() => { refresh(); }, []);

  const saveCurrentToDB = async () => {
    const { title, delta, html, id } = getActive();
    const newId = await dbSave({ id, title, delta, html });
    if (!id) getActive.setId(newId); // push back the new id to active
    await refresh();
  };

  const loadDraft = async (id) => {
    const d = await dbLoad(id);
    onLoad && onLoad(d);
  };

  const remove = async (id) => {
    await dbDelete(id);
    await refresh();
  };

  return (
    <div className="w-64 border-r p-3 flex flex-col">
      <div className="font-semibold mb-2">Saved Drafts</div>
      <div className="flex-1 overflow-auto space-y-2">
        {drafts.map(d=>(
          <div key={d.id} className="border rounded p-2">
            <button onClick={()=>loadDraft(d.id)} className="w-full text-left">
              <div className="font-medium truncate">{d.title || "Untitled"}</div>
              <div className="text-xs text-gray-500">{new Date(d.updatedAt).toLocaleString()}</div>
            </button>
            <div className="mt-1 flex gap-2">
              <button onClick={()=>remove(d.id)} className="text-xs text-red-600">Delete</button>
            </div>
          </div>
        ))}
        {!drafts.length && <div className="text-sm text-gray-500">No drafts yet</div>}
      </div>

      <button onClick={saveCurrentToDB} className="mt-3 px-3 py-2 rounded bg-gray-200">Save Draft</button>

      <button
        onClick={onMicClick}
        className={`mt-4 flex items-center justify-center gap-2 px-3 py-3 rounded text-white ${listening? "bg-red-500":"bg-blue-600"}`}
      >
        <span>🎤</span>{listening ? "Stop" : "Start"} Dictation
      </button>

      <div className="text-xs text-gray-500 mt-2">Say “Add Clause”, “New line”, etc.</div>
    </div>
  );
}
