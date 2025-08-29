// src/utils/exportDocx.js
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

export const exportDocxFromHtml = (htmlString, filename="Tamil-Draft.docx") => {
  // Simple HTML → text (keeps lines). For rich mapping, wire a converter later.
  const text = htmlString
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const paras = text.split("\n").map(t => new Paragraph(t));
  const doc = new Document({ sections: [{ children: paras }] });
  Packer.toBlob(doc).then(b => saveAs(b, filename));
};
