import { useRef, useState } from "react";

/**
 * Lightweight command matcher:
 *  - exact phrases (Tamil + English)
 *  - keyword + verb style ("சட்ட"+"நோட்டீஸ்"+"எழுது")
 */
const COMMAND_SETS = [
  // Legal notice write
  { id: "notice_template", keywordsAny: ["சட்ட", "நோட்டீஸ்"], verbsAny: ["எழுது", "எழுதுக", "தயார் செய்", "டெம்ப்ளேட்"] },

  // Formatting / structure
  { id: "bold",          phrases: ["தடித்த", "bold"] },
  { id: "italic",        phrases: ["சாய்வு", "italic"] },
  { id: "underline",     phrases: ["அடிக்கோடு", "underline"] },
  { id: "new_line",      phrases: ["புதிய வரி", "new line"] },
  { id: "new_paragraph", phrases: ["புதிய பதிவு", "புதிய பத்தி", "new paragraph"] },
  { id: "insert_date",   phrases: ["தேதி சேர்", "தேதி சேர்க்கவும்", "insert date"] },
  { id: "h1",            phrases: ["தலைப்பு ஒன்று", "heading one"] },
  { id: "h2",            phrases: ["தலைப்பு இரண்டு", "heading two"] },
  { id: "numbered_list", phrases: ["எண்கள் பட்டியல்", "numbered list"] },
  { id: "bullet_list",   phrases: ["புள்ளி பட்டியல்", "bullet list"] },

  // Line ops (broad triggers)
  { id: "delete_line",        phrases: ["இந்த வரியை அழி", "delete line", "delete this line"] },
  { id: "start_from_line",    phrases: ["இந்த வரியிலிருந்து தொடங்கு", "start from this line"] },
  { id: "copy_line",          phrases: ["நகலெடு", "copy line", "copy this line"] },
  { id: "insert_after",       phrases: ["insert line after"] },
  { id: "insert_before",      phrases: ["insert line before"] },

  // Tamil broad words that often appear around commands (to help route to handler)
  { id: "broad_ta",           phrases: ["வரி", "இந்த வரியை அழி", "இந்த வரியிலிருந்து தொடங்கு", "நகலெடு", "சேர்க்க", "தேர்வு", "தொடங்கு"] },
];

function normalizeTamil(s) {
  return (s || "").normalize("NFC").toLowerCase().trim();
}

function matchCommand(raw) {
  const txt = normalizeTamil(raw);
  for (const c of COMMAND_SETS) {
    if (c.phrases && c.phrases.some(p => txt.includes(normalizeTamil(p)))) {
      return c.id;
    }
    if (c.keywordsAny || c.verbsAny) {
      const kwOk = !c.keywordsAny || c.keywordsAny.some(k => txt.includes(normalizeTamil(k)));
      const vbOk = !c.verbsAny   || c.verbsAny.some(v => txt.includes(normalizeTamil(v)));
      if (kwOk && vbOk) return c.id;
    }
  }
  return null;
}

export default function useSpeechRecognition({ onText, onCommand }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);

  const ensure = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Use Chrome: Speech Recognition not supported.");
      return null;
    }
    if (recRef.current) return recRef.current;

    const rec = new window.webkitSpeechRecognition();
    rec.lang = "ta-IN";
    rec.continuous = true;
    rec.interimResults = true;   // we only act on finals below
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      const raw = (res?.[0]?.transcript || "").trim();
      if (!raw) return;

      const cmdId = matchCommand(raw);
      // Debug:
      // console.log("Voice CMD hit:", cmdId, "RAW:", raw, "final?", res.isFinal);

      if (!res.isFinal) return; // avoid acting on interims

      // Let the command handler consume it; if it returns true, do nothing else
      if (typeof onCommand === "function") {
        try {
          const consumed = !!onCommand(cmdId, raw, { isFinal: true });
          if (consumed) return;
        } catch (e) {
          // ignore handler errors and fall through to dictation
        }
      }

      // Not a command → treat as dictation
      if (typeof onText === "function") {
        onText(raw + " ");
      }
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recRef.current = rec;
    return rec;
  };

  const toggle = () => {
    const rec = ensure();
    if (!rec) return;

    if (!listeningRef.current) {
      try { rec.start(); } catch {}
      listeningRef.current = true;
      setListening(true);
    } else {
      try { rec.stop(); } catch {}
      listeningRef.current = false;
      setListening(false);
    }
  };

  return { listening, toggle };
}
