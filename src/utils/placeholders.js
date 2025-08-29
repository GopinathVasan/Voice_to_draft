// src/utils/placeholders.js

const PH_RE = /\{\{([^}]+)\}\}/g;

export const listPlaceholders = (plainText) => {
  const items = [];
  let m;
  while ((m = PH_RE.exec(plainText)) !== null) {
    items.push({
      start: m.index,
      end: m.index + m[0].length,
      label: m[1],
      raw: m[0],
    });
  }
  return items;
};

export const selectNextPlaceholder = (editor) => {
  if (!editor) return null;
  const txt = editor.getText();
  const sel = editor.getSelection(true) || { index: 0, length: 0 };
  const placeholders = listPlaceholders(txt);
  const next = placeholders.find((p) => p.start > sel.index);
  if (!next) return null;
  editor.setSelection(next.start, next.end - next.start);
  return next;
};

export const selectPrevPlaceholder = (editor) => {
  if (!editor) return null;
  const txt = editor.getText();
  const sel = editor.getSelection(true) || { index: 0, length: 0 };
  const placeholders = listPlaceholders(txt);
  const prev = [...placeholders].reverse().find((p) => p.end < sel.index);
  if (!prev) return null;
  editor.setSelection(prev.start, prev.end - prev.start);
  return prev;
};

export const replaceCurrentPlaceholder = (editor, value) => {
  const sel = editor.getSelection(true);
  if (!sel || sel.length === 0) return false;
  const selected = editor.getText(sel.index, sel.length);
  if (!/^\{\{[^}]+\}\}$/.test(selected)) return false;
  editor.deleteText(sel.index, sel.length);
  editor.insertText(sel.index, value);
  editor.setSelection(sel.index + value.length, 0);
  return true;
};

export const replacePlaceholderByLabel = (editor, label, value) => {
  if (!editor) return false;
  const txt = editor.getText();
  const placeholders = listPlaceholders(txt);
  const target = placeholders.find((p) =>
    p.label.toLowerCase().includes(label.toLowerCase())
  );
  if (!target) return false;
  editor.deleteText(target.start, target.end - target.start);
  editor.insertText(target.start, value);
  editor.setSelection(target.start + value.length, 0);
  return true;
};
