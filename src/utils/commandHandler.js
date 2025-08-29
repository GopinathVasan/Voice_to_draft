import { insertTemplate } from "./templateManager";
import { wordsToDigits } from "./numwords";
import {
  replacePlaceholderByLabel,
  replaceCurrentPlaceholder,
} from "./placeholders";
import {
  goToLine,
  deleteLine,
  caretToStartOfCurrentLine,
  selectLine,
  selectLines,
  copyLine,
  insertBlankLineAfter,
  insertBlankLineBefore,
} from "./lines";



/**
 * Returns true if a command was handled; false if not (so caller can insert text).
 */
export function handleVoiceCommand(editor, cmd, raw, { setVoiceClause, setClOpen } = {}) {
  if (!editor) return false;

const norm = wordsToDigits(raw || "");
//const lower = norm.toLowerCase();
  // ---------- Clause Library trigger ----------
  const taClause =
    raw?.match(/கிளாஸ்\s+சேர்\s+(.+)/i) || raw?.match(/கிளாஸ்\s+சேர்க்கவும்\s+(.+)/i);
  const enClause = raw?.toLowerCase().match(/add\s+clause\s+(.+)/i);
  const clauseMatch = taClause || enClause;
  if (clauseMatch && clauseMatch[1]) {
    setVoiceClause?.(clauseMatch[1].trim());
    setClOpen?.(true);
    return true;
  }

  // ---------- Placeholder replace by label ----------
  const taReplace = raw?.match(/(.+?) பெயரை (.+) ஆக மாற்று/);
  const enReplace = raw?.toLowerCase().match(/replace (.+?) with (.+)/);
  if (taReplace) {
    const [, label, value] = taReplace;
    replacePlaceholderByLabel(editor, label.trim(), value.trim());
    return true;
  }
  if (enReplace) {
    const [, label, value] = enReplace;
    replacePlaceholderByLabel(editor, label.trim(), value.trim());
    return true;
  }

  // ---------- Selection by lines ----------
  // EN
  const enSelectRange = raw?.toLowerCase().match(/select (from )?line (\d+)( to (line )?(\d+))?/);
  if (enSelectRange) {
    const s = Number(enSelectRange[2]);
    const e = enSelectRange[5] ? Number(enSelectRange[5]) : s;
    if (!Number.isNaN(s) && !Number.isNaN(e)) {
      if (s === e) selectLine(editor, s); else selectLines(editor, s, e);
      return true;
    }
  }
  // TA
  const taSelectRange = raw?.match(/வரி\s*(\d+)\s*முதல்\s*(\d+)\s*வரை\s*(தேர்வு|செலக்ட்)/);
  const taSelectOne   = raw?.match(/வரி\s*(\d+)\s*(தேர்வு|செலக்ட்)/);
  if (taSelectRange) { selectLines(editor, Number(taSelectRange[1]), Number(taSelectRange[2])); return true; }
  if (taSelectOne)   { selectLine(editor, Number(taSelectOne[1])); return true; }

  // ---------- Copy line ----------
  const enCopyThis = raw?.toLowerCase().match(/copy (this )?line/);
  const enCopyNum  = raw?.toLowerCase().match(/copy line (\d+)/);
  if (enCopyNum)  { copyLine(editor, Number(enCopyNum[1])); return true; }
  if (enCopyThis) { copyLine(editor, null); return true; }
  const taCopyThis = raw?.match(/இந்த\s*வரியை\s*நகலெடு/);
  const taCopyNum  = raw?.match(/வரி\s*(\d+)\s*நகலெடு/);
  if (taCopyNum)  { copyLine(editor, Number(taCopyNum[1])); return true; }
  if (taCopyThis) { copyLine(editor, null); return true; }

  // ---------- Insert line after/before ----------
  const enInsAfterNum1  = raw?.toLowerCase().match(/insert (a )?new line after (\d+)/);
  const enInsAfterNum2  = raw?.toLowerCase().match(/insert line after (\d+)/);
  const enInsBeforeNum1 = raw?.toLowerCase().match(/insert (a )?new line before (\d+)/);
  const enInsBeforeNum2 = raw?.toLowerCase().match(/insert line before (\d+)/);

  if (enInsAfterNum1 || enInsAfterNum2) {
    const n = Number(enInsAfterNum1?.[2] || enInsAfterNum2?.[1]);
    insertBlankLineAfter(editor, n);
    return true;
  }
  if (enInsBeforeNum1 || enInsBeforeNum2) {
    const n = Number(enInsBeforeNum1?.[2] || enInsBeforeNum2?.[1]);
    insertBlankLineBefore(editor, n);
    return true;
  }

  const enInsAfterThis  = raw?.toLowerCase().match(/insert (a )?new line after (this )?line/);
  const enInsBeforeThis = raw?.toLowerCase().match(/insert (a )?new line before (this )?line/);
  if (enInsAfterThis)  { insertBlankLineAfter(editor, null); return true; }
  if (enInsBeforeThis) { insertBlankLineBefore(editor, null); return true; }

  // TA
  const taInsAfterNum  = raw?.match(/வரி\s*(\d+).*(பிறகு).*(வரி|புதிய\s*வரி).*சேர்க்க/);
  const taInsBeforeNum = raw?.match(/வரி\s*(\d+).*(முன்).*(வரி|புதிய\s*வரி).*சேர்க்க/);
  const taInsAfterThis = raw?.match(/இந்த\s*வரிக்குப்?\s*பிறகு.*வரி.*சேர்க்க/);
  const taInsBeforeThis= raw?.match(/இந்த\s*வரிக்கு\s*முன்.*வரி.*சேர்க்க/);
  if (taInsAfterNum)   { insertBlankLineAfter(editor, Number(taInsAfterNum[1])); return true; }
  if (taInsBeforeNum)  { insertBlankLineBefore(editor, Number(taInsBeforeNum[1])); return true; }
  if (taInsAfterThis)  { insertBlankLineAfter(editor, null); return true; }
  if (taInsBeforeThis) { insertBlankLineBefore(editor, null); return true; }

  // ---------- Navigation & delete ----------
  const enGoTo       = raw?.toLowerCase().match(/go to (the )?(\d+)(st|nd|rd|th)? line|go to line (\d+)/);
  const enDeleteLine = raw?.toLowerCase().match(/delete line (\d+)/);
  const enDeleteThis = raw?.toLowerCase().match(/delete (this )?line/);
  const enStartHere  = raw?.toLowerCase().match(/start from this line/);

  const taGoTo =
    raw?.match(/வரி\s*(\d+)\s*(க்கு)?\s*போ/) ||
    raw?.match(/(\d+)\s*வது\s*வரிக்கு?\s*போ/);
  const taDeleteLine = raw?.match(/வரி\s*(\d+)\s*(அழி|நீக்கு)/);
  const taDeleteThis = raw?.match(/இந்த\s*வரியை\s*(அழி|நீக்கு)/);
  const taStartHere  = raw?.match(/இந்த\s*வரியிலிருந்து\s*தொடங்கு/);

  const gotoNum = Number(enGoTo?.[2] || enGoTo?.[4] || taGoTo?.[1] || taGoTo?.[2]);
  if (!Number.isNaN(gotoNum) && gotoNum > 0) { goToLine(editor, gotoNum); return true; }

  const delNum = Number(enDeleteLine?.[1] || taDeleteLine?.[1]);
  if (!Number.isNaN(delNum) && delNum > 0) { deleteLine(editor, delNum); return true; }

  if (enDeleteThis || taDeleteThis) { deleteLine(editor, null); return true; }
  if (enStartHere  || taStartHere)  { caretToStartOfCurrentLine(editor); return true; }

  // ---------- Simple command IDs (from your hook's matchCommand) ----------
  if (cmd) {
    const sel = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
    const insert = (t) => { editor.insertText(sel.index, t); editor.setSelection(sel.index + t.length); };

    switch (cmd) {
      case "new_line":       insert("\n"); return true;
      case "new_paragraph":  insert("\n\n"); return true;
      case "bold":           editor.format("bold", true); return true;
      case "italic":         editor.format("italic", true); return true;
      case "underline":      editor.format("underline", true); return true;
      case "insert_date":    insert(new Date().toLocaleDateString("ta-IN") + " "); return true;
      case "h1":             editor.format("size", "huge"); editor.format("bold", true); return true;
      case "h2":             editor.format("size", "large"); editor.format("bold", true); return true;
      case "numbered_list":  editor.format("list", "ordered"); return true;
      case "bullet_list":    editor.format("list", "bullet"); return true;

      case "delete_line":    deleteLine(editor, null); return true;
      case "start_from_line": caretToStartOfCurrentLine(editor); return true;
      case "copy_line":      copyLine(editor, null); return true;
      case "insert_after":   insertBlankLineAfter(editor, null); return true;
      case "insert_before":  insertBlankLineBefore(editor, null); return true;

      case "notice_template": insertTemplate(editor, "notice"); return true;
      default: break;
    }
  }

  // ---------- Voice templates by spoken English/Tamil ----------
  const lower = raw?.toLowerCase?.() || "";
  if (lower.includes("petition template") || raw?.includes?.("மனு டெம்ப்ளேட்")) { insertTemplate(editor, "petition"); return true; }
  if (lower.includes("affidavit template")) { insertTemplate(editor, "affidavit"); return true; }
  if (lower.includes("notice template"))    { insertTemplate(editor, "notice"); return true; }

  return false; // not handled → caller may insert the text
}
