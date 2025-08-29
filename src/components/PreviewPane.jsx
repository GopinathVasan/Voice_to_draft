import React from "react";
import { exportPDF } from "../utils/exportPDF";
import { exportDocxFromHtml } from "../utils/exportDocx";
import { exportDocxFromDelta } from "../utils/exportDocxRich";

export default function PreviewPane({ html }) {
  return (
    <div className="w-96 border-l p-4 flex flex-col">
      <div className="font-semibold mb-2">Preview</div>
      <div id="preview" className="flex-1 overflow-auto bg-white rounded border p-4">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>exportPDF("preview","Tamil-Draft.pdf")} className="px-3 py-2 rounded bg-indigo-600 text-white">
          Export as PDF
        </button>
        <button onClick={()=>exportDocxFromHtml(document.getElementById("preview").innerHTML,"Tamil-Draft.docx")} className="px-3 py-2 rounded border">
          Export as Word
        </button>
        <button
  onClick={() => exportDocxFromDelta(window.__ACTIVE_DELTA__ || null, "Tamil-Draft.docx")}
  className="px-3 py-2 rounded border"
>
  Export as Word
</button>
      </div>
    </div>
  );
}
