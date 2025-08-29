// src/utils/templateManager.js
import { selectNextPlaceholder } from "./placeholders";

export const TEMPLATES = {
  petition: `— மனு —
மனுதாரர்: {{மனுதாரர் பெயர்}}
எதிர்மனுதாரர்: {{எதிர்மனுதாரர் பெயர்}}

வழக்கின் சுருக்கம்:
{{விவரம்}}

வேண்டுகோள்:
1) {{வேண்டுகோள் 1}}
2) {{வேண்டுகோள் 2}}

தேதி: {{இன்றைய தேதி}}
கையொப்பம்: __________
`,
  affidavit: `— உறுதிமொழி —
பெயர்: {{பெயர்}}
முகவரி: {{முகவரி}}

உறுதிமொழி:
நான் மேலே கூறியவை உண்மையென உறுதிப்படுத்துகிறேன்.

தேதி: {{இன்றைய தேதி}}
கையொப்பம்: __________
`,
  notice: `— சட்ட நோட்டீஸ் —
அனுப்புநர்: {{அனுப்புநர் பெயர்}}
பெறுநர்: {{பெறுநர் பெயர்}}

பொருள்: {{பொருள்}}

விவரம்:
{{விவரம்}}

இந்த நோட்டீஸை பெற்ற 15 நாட்களுக்குள் பதில் அளிக்க வேண்டுகிறோம்.

தேதி: {{இன்றைய தேதி}}
கையொப்பம்: __________
`,
};

/**
 * Inserts a template and jumps caret to the first {{placeholder}}
 */
export function insertTemplate(editor, key) {
  if (!editor || !TEMPLATES[key]) return;
  // Fill today's date tokens
  const today = new Date().toLocaleDateString("ta-IN");
  const text = TEMPLATES[key].replaceAll("{{இன்றைய தேதி}}", today);

  const idx = editor.getSelection(true)?.index ?? editor.getLength();
  editor.insertText(idx, text);
  editor.setSelection(idx + text.length);

  // Auto-select first placeholder so user can voice-replace immediately
  // Move caret to start of inserted block first (so "next" finds the first one)
  editor.setSelection(idx, 0);
  selectNextPlaceholder(editor);
}
