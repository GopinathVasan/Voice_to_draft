// src/utils/lines.js

const computeLineStarts = (text) => {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return starts;
};

export const getLineMap = (editor) => {
  const text = editor.getText(); // Quill text (includes trailing \n)
  const starts = computeLineStarts(text);
  const lines = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i === starts.length - 1 ? text.length : starts[i + 1] - 1; // exclude newline
    lines.push({ index: i + 1, start, end }); // 1-based
  }
  return { lines, starts, text };
};

export const getCurrentLineNumber = (editor) => {
  const { starts } = getLineMap(editor);
  const sel = editor.getSelection(true) || { index: 0, length: 0 };
  let line = 1;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= sel.index) line = i + 1; else break;
  }
  return line;
};

export const goToLine = (editor, n) => {
  const { lines } = getLineMap(editor);
  if (n < 1 || n > lines.length) return false;
  const { start } = lines[n - 1];
  editor.setSelection(start, 0);
  return true;
};

export const deleteLine = (editor, n = null) => {
  const { lines } = getLineMap(editor);
  let target = n ?? getCurrentLineNumber(editor);
  if (target < 1 || target > lines.length) return false;
  const { start, end } = lines[target - 1];
  const len = Math.max(0, (end + 1) - start); // include newline if present
  editor.deleteText(start, len);
  editor.setSelection(start, 0);
  return true;
};

export const caretToStartOfCurrentLine = (editor) => {
  const line = getCurrentLineNumber(editor);
  return goToLine(editor, line);
};

// NEW: select a single line (default = current)
export const selectLine = (editor, n = null) => {
  const { lines } = getLineMap(editor);
  const target = n ?? getCurrentLineNumber(editor);
  if (target < 1 || target > lines.length) return false;
  const { start, end } = lines[target - 1];
  editor.setSelection(start, Math.max(0, end - start));
  return true;
};

// NEW: select range of lines inclusive (start..end)
export const selectLines = (editor, startLine, endLine) => {
  const { lines } = getLineMap(editor);
  const s = Math.max(1, Math.min(startLine, endLine));
  const e = Math.min(lines.length, Math.max(startLine, endLine));
  const { start } = lines[s - 1];
  const { end } = lines[e - 1];
  editor.setSelection(start, Math.max(0, end - start));
  return true;
};

// NEW: copy line text to clipboard (default current line)
export const copyLine = async (editor, n = null) => {
  const { lines, text } = getLineMap(editor);
  const target = n ?? getCurrentLineNumber(editor);
  if (target < 1 || target > lines.length) return false;
  const { start, end } = lines[target - 1];
  const lineText = text.slice(start, end);
  try {
    await navigator.clipboard.writeText(lineText);
    return true;
  } catch {
    // Fallback: select the line so user can Ctrl+C
    editor.setSelection(start, Math.max(0, end - start));
    alert("Clipboard not available. Line selected — press Ctrl+C to copy.");
    return false;
  }
};

// NEW: insert blank line after/before a given or current line
export const insertBlankLineAfter = (editor, n = null) => {
  const { lines } = getLineMap(editor);
  const target = n ?? getCurrentLineNumber(editor);
  if (target < 1 || target > lines.length) return false;
  const { end } = lines[target - 1];
  // insert at end+1 (right after newline position)
  editor.insertText(end + 1, "\n");
  editor.setSelection(end + 2, 0);
  return true;
};

export const insertBlankLineBefore = (editor, n = null) => {
  const { lines } = getLineMap(editor);
  const target = n ?? getCurrentLineNumber(editor);
  if (target < 1 || target > lines.length) return false;
  const { start } = lines[target - 1];
  editor.insertText(start, "\n");
  editor.setSelection(start, 0);
  return true;
};
