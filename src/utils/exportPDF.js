// src/utils/exportPDF.js
import html2pdf from "html2pdf.js";

export const exportPDF = (elementId, filename="Tamil-Draft.pdf") => {
  const el = document.getElementById(elementId);
  if (!el) return;
  const opt = {
    margin: [10,10,10,10],
    filename,
    image: { type:"jpeg", quality:0.98 },
    html2canvas: { scale:2, useCORS:true, letterRendering:true },
    jsPDF: { unit:"mm", format:"a4", orientation:"portrait" },
    pagebreak: { mode:["css","legacy"] }
  };
  html2pdf().set(opt).from(el).save();
};
