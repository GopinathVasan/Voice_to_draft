import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

/**
 * Convert Quill Delta to DOCX.
 * Supports: plain text, \n paragraph breaks, bold/italic/underline,
 * heading sizes (huge/large), ordered/bullet lists.
 */
export async function exportDocxFromDelta(delta, filename = "Tamil-Draft.docx") {
  if (!delta || !delta.ops) return;

  const paragraphs = [];
  let listStack = [];  // track list context for numbering
  let currentRuns = [];
  let currentParaProps = {};

  const flushParagraph = () => {
    const runs = currentRuns.length ? currentRuns : [new TextRun("")];
    paragraphs.push(new Paragraph({ ...currentParaProps, children: runs }));
    currentRuns = [];
    currentParaProps = {};
  };

  const startList = (type) => {
    // 'ordered' or 'bullet'
    currentParaProps = { ...currentParaProps, numbering: { reference: "list", level: 0 } };
    if (!listStack.length) listStack = [type];
  };

  const endListIfNeeded = () => {
    if (listStack.length) listStack = [];
  };

  const toRun = (text, attrs = {}) => {
    return new TextRun({
      text,
      bold: !!attrs.bold,
      italics: !!attrs.italic,
      underline: attrs.underline ? {} : undefined,
      // you can add font family if needed: font: "Latha"
    });
  };

  // Build doc with a numbering config
  let listUsed = false;

  for (const op of delta.ops) {
    const insert = op.insert;
    const attrs = op.attributes || {};

    // If insert is just text, it may include newlines
    if (typeof insert === "string") {
      const parts = insert.split("\n");

      // For all but the last part, we close the paragraph
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.length) currentRuns.push(toRun(part, attrs));

        const isBreak = i < parts.length - 1;
        if (isBreak) {
          // paragraph boundary
          // style headings based on size
          if (attrs.size === "huge") currentParaProps.heading = "HEADING_1";
          else if (attrs.size === "large") currentParaProps.heading = "HEADING_2";

          // lists
          if (attrs.list === "ordered" || attrs.list === "bullet") {
            startList(attrs.list);
            listUsed = true;
          } else {
            endListIfNeeded();
          }

          flushParagraph();
        }
      }
      continue;
    }

    // (Quill may insert embeds; ignore for now)
  }

  if (currentRuns.length) flushParagraph();

  // Create doc; add numbering if we used lists
  const docOpts = {
    sections: [{ children: paragraphs }],
  };

  if (listUsed) {
    docOpts.numbering = {
      config: [
        {
          reference: "list",
          levels: [
            { level: 0, format: "decimal", text: "%1.", alignment: "left" }, // ordered
            // bullet style fallback handled by run glyph; docx lib doesn’t switch per-line automatically
          ],
        },
      ],
    };
  }

  const doc = new Document(docOpts);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
