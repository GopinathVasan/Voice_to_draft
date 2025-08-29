// src/utils/numwords.js
const taMap = {
  "பூஜ்யம்":0,"சுழியம்":0,
  "ஒன்று":1,"முதல்":1,"ஒன்றாம்":1,
  "இரண்டு":2,"இரண்டாம்":2,"இரண்டாவது":2,
  "மூன்று":3,"மூன்றாம்":3,"மூன்றாவது":3,
  "நான்கு":4,"நான்காம்":4,"நான்காவது":4,
  "ஐந்து":5,"ஐந்தாம்":5,"ஐந்தாவது":5,
  "ஆறு":6,"ஆறாம்":6,"ஆறாவது":6,
  "ஏழு":7,"ஏழாம்":7,"ஏழாவது":7,
  "எட்டு":8,"எட்டாம்":8,"எட்டாவது":8,
  "ஒன்பது":9,"ஒன்பதாம்":9,"ஒன்பதாவது":9,
  "பத்து":10,"பத்தாம்":10,"பத்தாவது":10,
  "பதினொன்று":11,"பனிரெண்டு":12,"பன்னிரண்டு":12,
  "பதிமூன்று":13,"பதிநான்கு":14,"பதினைந்து":15,
  "பதினாறு":16,"பதினேழு":17,"பதினெட்டு":18,"பத்தொன்பது":19,
  "இருபது":20,"முப்பது":30,"நாற்பது":40,"ஐம்பது":50,
};
const enOrdMap = {
  "first":1,"1st":1,"second":2,"2nd":2,"third":3,"3rd":3,
  "fourth":4,"4th":4,"fifth":5,"5th":5,"sixth":6,"6th":6,
  "seventh":7,"7th":7,"eighth":8,"8th":8,"ninth":9,"9th":9,
  "tenth":10,"10th":10,
};

export function wordsToDigits(input) {
  if (!input) return input;
  let s = input;

  // fix common mishear: "first night" -> "first line"
  s = s.replace(/\bfirst\s+night\b/gi, "first line");

  // English ordinals to digits
  for (const [w,n] of Object.entries(enOrdMap)) {
    const re = new RegExp(`\\b${w}\\b`, "gi");
    s = s.replace(re, String(n));
  }

  // Tamil number words → digits (simple pass)
  for (const [w,n] of Object.entries(taMap)) {
    const re = new RegExp(w, "g"); // Tamil is case-insensitive effectively
    s = s.replace(re, String(n));
  }

  // Tamil '(\d+)வது' → \1 (ordinal suffix)
  s = s.replace(/(\d+)\s*வது/gi, "$1");

  return s;
}
