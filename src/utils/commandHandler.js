import { insertTemplate } from "./templateManager";
import {
  replacePlaceholderByLabel,
  replaceCurrentPlaceholder
} from "./placeholders";
import {
  goToLine,
  deleteLine,
  caretToStartOfCurrentLine,
  selectLine,
  selectLines,
  copyLine,
  insertBlankLineAfter,
  insertBlankLineBefore
} from "./lines";

export function handleVoiceCommand(editor, cmd, raw, { setVoiceClause, setClOpen }) {
  if (!editor) return;

  
  // ---------- Clause Library trigger (unchanged) ----------
  const taClause = raw?.match(/கிளாஸ்\s+சேர்\s+(.+)/i) || raw?.match(/கிளாஸ்\s+சேர்க்கவும்\s+(.+)/i);
  const enClause = raw?.toLowerCase().match(/add\s+clause\s+(.+)/i);
  const clauseMatch = taClause || enClause;
  if (clauseMatch && clauseMatch[1]) {
    setVoiceClause(clauseMatch[1].trim());
    setClOpen(true);
    return;
  }

  // ---------- Placeholder replace by label (unchanged) ----------
  const taReplace = raw?.match(/(.+?) பெயரை (.+) ஆக மாற்று/);          // "<label> பெயரை <value> ஆக மாற்று"
  const enReplace = raw?.toLowerCase().match(/replace (.+?) with (.+)/); // "replace <label> with <value>"
  if (taReplace) {
    const [, label, value] = taReplace;
    replacePlaceholderByLabel(editor, label.trim(), value.trim());
    return;
  }
  if (enReplace) {
    const [, label, value] = enReplace;
    replacePlaceholderByLabel(editor, label.trim(), value.trim());
    return;
  }

  // -------- NEW: Selection by lines --------
  // EN: "select from line 5 to 12", "select line 7"
  const enSelectRange = raw?.toLowerCase().match(/select (from )?line (\d+)( to (line )?(\d+))?/);
  if (enSelectRange) {
    const s = Number(enSelectRange[2]);
    const e = enSelectRange[5] ? Number(enSelectRange[5]) : s;
    if (!Number.isNaN(s) && !Number.isNaN(e)) {
      if (s === e) selectLine(editor, s); else selectLines(editor, s, e);
      return;
    }
  }
  // TA: "வரி 5 முதல் 12 வரை தேர்வு செய்" / "வரி 8 தேர்வு செய்"
  const taSelectRange = raw?.match(/வரி\s*(\d+)\s*முதல்\s*(\d+)\s*வரை\s*(தேர்வு|செலக்ட்)/);
  const taSelectOne   = raw?.match(/வரி\s*(\d+)\s*(தேர்வு|செலக்ட்)/);
  if (taSelectRange) {
    const s = Number(taSelectRange[1]), e = Number(taSelectRange[2]);
    selectLines(editor, s, e); return;
  }
  if (taSelectOne) {
    const n = Number(taSelectOne[1]);
    selectLine(editor, n); return;
  }

  // -------- NEW: Copy line --------
  // EN: "copy this line", "copy line 10"
  const enCopyThis = raw?.toLowerCase().match(/copy (this )?line/);
  const enCopyNum  = raw?.toLowerCase().match(/copy line (\d+)/);
  if (enCopyNum) { copyLine(editor, Number(enCopyNum[1])); return; }
  if (enCopyThis) { copyLine(editor, null); return; }
  // TA: "இந்த வரியை நகலெடு", "வரி 10 நகலெடு"
  const taCopyThis = raw?.match(/இந்த\s*வரியை\s*நகலெடு/);
  const taCopyNum  = raw?.match(/வரி\s*(\d+)\s*நகலெடு/);
  if (taCopyNum) { copyLine(editor, Number(taCopyNum[1])); return; }
  if (taCopyThis) { copyLine(editor, null); return; }

    // -------- NEW: Insert line after/before --------
  const enInsAfterNum1  = raw?.toLowerCase().match(/insert (a )?new line after (\d+)/);
  const enInsAfterNum2  = raw?.toLowerCase().match(/insert line after (\d+)/);
  const enInsBeforeNum1 = raw?.toLowerCase().match(/insert (a )?new line before (\d+)/);
  const enInsBeforeNum2 = raw?.toLowerCase().match(/insert line before (\d+)/);

  if (enInsAfterNum1 || enInsAfterNum2) {
    const n = Number(enInsAfterNum1?.[2] || enInsAfterNum2?.[1]);
    insertBlankLineAfter(editor, n);
    return;
  }
  if (enInsBeforeNum1 || enInsBeforeNum2) {
    const n = Number(enInsBeforeNum1?.[2] || enInsBeforeNum2?.[1]);
    insertBlankLineBefore(editor, n);
    return;
  }

  const enInsAfterThis  = raw?.toLowerCase().match(/insert (a )?new line after (this )?line/);
  const enInsBeforeThis = raw?.toLowerCase().match(/insert (a )?new line before (this )?line/);

  if (enInsAfterThis)  { insertBlankLineAfter(editor, null); return; }
  if (enInsBeforeThis) { insertBlankLineBefore(editor, null); return; }

  // TA: "வரி 10 க்குப் பிறகு ஒரு வரி சேர்க்க", "வரி 7 க்கு முன் ஒரு வரி சேர்க்க"
  const taInsAfterNum  = raw?.match(/வரி\s*(\d+).*(பிறகு).*(வரி|புதிய\s*வரி).*சேர்க்க/);
  const taInsBeforeNum = raw?.match(/வரி\s*(\d+).*(முன்).*(வரி|புதிய\s*வரி).*சேர்க்க/);
  const taInsAfterThis = raw?.match(/இந்த\s*வரிக்குப்?\s*பிறகு.*வரி.*சேர்க்க/);
  const taInsBeforeThis= raw?.match(/இந்த\s*வரிக்கு\s*முன்.*வரி.*சேர்க்க/);

  if (taInsAfterNum)   { insertBlankLineAfter(editor, Number(taInsAfterNum[1])); return; }
  if (taInsBeforeNum)  { insertBlankLineBefore(editor, Number(taInsBeforeNum[1])); return; }
  if (taInsAfterThis)  { insertBlankLineAfter(editor, null); return; }
  if (taInsBeforeThis) { insertBlankLineBefore(editor, null); return; }


  // ---------- NEW: Line navigation & edits ----------
  const enGoTo = raw?.toLowerCase().match(/go to (the )?(\d+)(st|nd|rd|th)? line|go to line (\d+)/);
  const enDeleteLine = raw?.toLowerCase().match(/delete line (\d+)/);
  const enDeleteThis = raw?.toLowerCase().match(/delete (this )?line/);
  const enStartHere = raw?.toLowerCase().match(/start from this line/);

  // Tamil examples:
  // "வரி 50 க்கு போ" / "50வது வரிக்கு போ"
  const taGoTo =
    raw?.match(/வரி\s*(\d+)\s*(க்கு)?\s*போ/) ||
    raw?.match(/(\d+)\s*வது\s*வரிக்கு?\s*போ/);
  const taDeleteLine = raw?.match(/வரி\s*(\d+)\s*(அழி|நீக்கு)/);
  const taDeleteThis = raw?.match(/இந்த\s*வரியை\s*(அழி|நீக்கு)/);
  const taStartHere = raw?.match(/இந்த\s*வரியிலிருந்து\s*தொடங்கு/);

  // go to line N
  const gotoNum =
    Number(enGoTo?.[2] || enGoTo?.[4] || taGoTo?.[1] || taGoTo?.[2]);
  if (!Number.isNaN(gotoNum) && gotoNum > 0) {
    goToLine(editor, gotoNum);
    return;
  }

  // delete line N
  const delNum = Number(enDeleteLine?.[1] || taDeleteLine?.[1]);
  if (!Number.isNaN(delNum) && delNum > 0) {
    deleteLine(editor, delNum);
    return;
  }

  // delete this line
  if (enDeleteThis || taDeleteThis) {
    deleteLine(editor, null); // current line
    return;
  }

  // start from this line (move caret to start of current line)
  if (enStartHere || taStartHere) {
    caretToStartOfCurrentLine(editor);
    return;
  }

  // ---------- Existing simple commands ----------
  const sel = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
  const insert = (t) => {
    editor.insertText(sel.index, t);
    editor.setSelection(sel.index + t.length);
  };

  switch (cmd) {
    case "new line":
    case "புதிய வரி":
      insert("\n");
      break;
    case "new paragraph":
    case "புதிய பதிவை":
    case "புதிய பதிவு":
    case "புதிய பத்தி":
      insert("\n\n");
      break;
    case "bold":
    case "தடித்த":
      editor.format("bold", true);
      break;
    case "italic":
    case "சாய்வு":
      editor.format("italic", true);
      break;
    case "underline":
    case "அடிக்கோடு":
      editor.format("underline", true);
      break;
    case "insert date":
    case "தேதி சேர்":
    case "தேதி சேர்க்கவும்": {
      const d = new Date().toLocaleDateString("ta-IN");
      insert(d + " ");
      break;
    }
    case "heading one":
    case "தலைப்பு ஒன்று":
      editor.format("size", "huge");
      editor.format("bold", true);
      break;
    case "heading two":
    case "தலைப்பு இரண்டு":
      editor.format("size", "large");
      editor.format("bold", true);
      break;
    case "numbered list":
    case "எண்கள் பட்டியல்":
      editor.format("list", "ordered");
      break;
    case "bullet list":
    case "புள்ளி பட்டியல்":
      editor.format("list", "bullet");
      break;

    // Templates
    case "petition template":
    case "affidavit template":
    case "notice template":
    case "மனு டெம்ப்ளேட்": {
      const map = {
        "petition template": "petition",
        "affidavit template": "affidavit",
        "notice template": "notice",
        "மனு டெம்ப்ளேட்": "petition",
      };
      const key = map[cmd] || "petition";
      insertTemplate(editor, key);
      break;
    }

    default:
      break;
  }
}
