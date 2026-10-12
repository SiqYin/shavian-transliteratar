#!/usr/bin/env node
/* Accuracy tests for the Shavian engine.  Run: node tests/test.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "tables.js"), "utf8"), { filename: "tables.js" });
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "data.js"), "utf8"), { filename: "data.js" });
const S = require(path.join(ROOT, "web", "engine.js"));

/* readable Shavian helpers (official codepoints U+10450..U+1047F) */
const SH = {
  Peep: "\u{10450}", Tot: "\u{10451}", Kick: "\u{10452}", Fee: "\u{10453}",
  Thigh: "\u{10454}", So: "\u{10455}", Sure: "\u{10456}", Church: "\u{10457}",
  Yea: "\u{10458}", Hung: "\u{10459}", Bib: "\u{1045A}", Dead: "\u{1045B}",
  Gag: "\u{1045C}", Vow: "\u{1045D}", They: "\u{1045E}", Zoo: "\u{1045F}",
  Measure: "\u{10460}", Judge: "\u{10461}", Woe: "\u{10462}", Haha: "\u{10463}",
  Loll: "\u{10464}", Roar: "\u{1046E}", Mime: "\u{10465}", Nun: "\u{1046F}",
  If: "\u{10466}", Eat: "\u{10470}", Egg: "\u{10467}", Age: "\u{10471}",
  Ash: "\u{10468}", Ice: "\u{10472}", Ado: "\u{10469}", Up: "\u{10473}",
  On: "\u{1046A}", Oak: "\u{10474}", Wool: "\u{1046B}", Ooze: "\u{10475}",
  Out: "\u{1046C}", Oil: "\u{10476}", Ah: "\u{1046D}", Awe: "\u{10477}",
  Are: "\u{10478}", Or: "\u{10479}", Air: "\u{1047A}", Err: "\u{1047B}",
  Array: "\u{1047C}", Ear: "\u{1047D}", Ian: "\u{1047E}", Yew: "\u{1047F}",
};

let pass = 0, fail = 0;
const failures = [];
function eq(actual, expected, label) {
  if (actual === expected) { pass++; }
  else { fail++; failures.push(`${label}\n     expected: ${expected}\n     actual  : ${actual}`); }
}
function ok(cond, label, extra) {
  if (cond) { pass++; } else { fail++; failures.push(label + (extra ? "\n     " + extra : "")); }
}
function section(t) { console.log("\n" + t); }

const fw = (t, o) => S.textToShavian(t, o).shavian;
const ipa = (t, o) => S.textToShavian(t, o).ipa;
const back = (t, o) => S.shavianToEnglish(t, o).english;
const C = (...a) => a.join("");

section("1. Shavian spelling (letter-for-letter)");
eq(fw("cat"), C(SH.Kick, SH.Ash, SH.Tot), "cat = Kick-Ash-Tot");
eq(fw("phone"), C(SH.Fee, SH.Oak, SH.Nun), "phone = Fee-Oak-Nun");
eq(fw("she"), C(SH.Sure, SH.Eat), "she = Sure-Eat (/ʃiː/)");
eq(fw("English"), C(SH.If, SH.Hung, SH.Gag, SH.Loll, SH.If, SH.Sure), "English");
eq(fw("the"), C(SH.They, SH.Ado), "the = They-Ado (schwa)");
eq(fw("cup"), C(SH.Kick, SH.Up, SH.Peep), "cup = Kick-Up-Peep");
eq(fw("water"), C(SH.Woe, SH.Awe, SH.Tot, SH.Array), "water (US) = Woe-Awe-Tot-Array");
eq(fw("human"), C(SH.Haha, SH.Yew, SH.Mime, SH.Ado, SH.Nun), "human = Haha-Yew-Mime-Ado-Nun");
eq(fw("butter"), C(SH.Bib, SH.Up, SH.Tot, SH.Array), "butter = Bib-Up-Tot-Array");
eq(fw("nation"), C(SH.Nun, SH.Age, C(SH.Sure, SH.Ado), SH.Nun), "nation = Nun-Age-Sure-Ado-Nun");
eq(fw("bridge"), C(SH.Bib, SH.Roar, SH.If, SH.Judge), "bridge = Bib-Roar-If-Judge");
eq(fw("zoo"), C(SH.Zoo, SH.Ooze), "zoo = Zoo-Ooze");
eq(fw("light"), C(SH.Loll, SH.Ice, SH.Tot), "light = Loll-Ice-Tot");
eq(fw("think"), C(SH.Thigh, SH.If, SH.Hung, SH.Kick), "think = Thigh-If-Hung-Kick");
eq(fw("judge"), C(SH.Judge, SH.Up, SH.Judge), "judge = Judge-Up-Judge (verb /dʒʌdʒ/)");
eq(fw("measure"), C(SH.Mime, SH.Egg, SH.Measure, SH.Array), "measure = Mime-Egg-Measure-Array");

section("2. IPA (CMUdict, General American)");
eq(ipa("cat"), "/ˈkæt/", "IPA cat");
eq(ipa("phone"), "/ˈfoʊn/", "IPA phone");
eq(ipa("hello"), "/həˈloʊ/", "IPA hello");
eq(ipa("computer"), "/kəmˈpjuːtɚ/", "IPA computer (stress before onset p)");
eq(ipa("water"), "/ˈwɔːtɚ/", "IPA water");
eq(ipa("hello world"), "/həˈloʊ/ /ˈwɚld/", "IPA two words");
eq(ipa("nation"), "/ˈneɪʃən/", "IPA nation");
eq(ipa("understand"), "/ˌʌndɚˈstænd/", "IPA understand");
eq(ipa("strengthen"), "/ˈstɹɛŋθən/", "IPA strengthen (s-tr onset)");
eq(ipa("extra"), "/ˈɛkstɹə/", "IPA extra");
eq(ipa("sh"), "/ʃ/", "IPA sh");

section("3. RP (non-rhotic) mode");
eq(fw("water", { mode: "uk" }), C(SH.Woe, SH.Awe, SH.Tot, SH.Ado), "water RP = Woe-Awe-Tot-Ado");
eq(fw("car", { mode: "uk" }), C(SH.Kick, SH.Are), "car RP = Kick-Are");
eq(fw("car", { mode: "us" }), C(SH.Kick, SH.Ah, SH.Roar), "car US = Kick-Ah-Roar");
eq(fw("here", { mode: "uk" }), C(SH.Haha, SH.Ear), "here RP = Haha-Ear");
eq(fw("work", { mode: "uk" }), C(SH.Woe, SH.Err, SH.Kick), "work RP = Woe-Err-Kick");
eq(fw("very", { mode: "uk" }), C(SH.Vow, SH.Air, SH.Roar, SH.Eat), "very RP keeps linking r");

section("4. Shavian -> English");
eq(back(C(SH.Kick, SH.Ash, SH.Tot)), "cat", "reverse cat");
eq(back(C(SH.Fee, SH.Oak, SH.Nun)), "phone", "reverse phone");
eq(back(C(SH.If, SH.Hung, SH.Gag, SH.Loll, SH.If, SH.Sure)), "english", "reverse english");
eq(back(C(SH.Sure, SH.Awe)), "shaw", "reverse shaw");
eq(back(C(SH.Haha, SH.Ado, SH.Loll, SH.Oak)), "hello", "reverse hello");
eq(back(C(SH.Kick, SH.Ado, SH.Mime, SH.Peep, SH.Yew, SH.Tot, SH.Array)), "computer", "reverse computer");
ok(/\bhello world\b/.test(back(C(SH.Haha, SH.Ado, SH.Loll, SH.Oak) + " " + C(SH.Woe, SH.Array, SH.Loll, SH.Dead))), "reverse two words",
  back(C(SH.Haha, SH.Ado, SH.Loll, SH.Oak) + " " + C(SH.Woe, SH.Array, SH.Loll, SH.Dead)));

section("5. Round trip on prose");
const corpus = [
  "The quick brown fox jumps over the lazy dog.",
  "Knowledge is power; time is money.",
  "Peter Piper picked a peck of pickled peppers.",
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck?",
  "I really thought you would have told me sooner.",
  "My bank account is empty; I am completely broke.",
  "Please send the report to my e-mail address before Friday.",
  "It was the best of times, it was the worst of times.",
  "Weather forecasting is difficult in mountainous regions.",
];
let totalWords = 0, exact = 0; const wrongList = [];
for (const line of corpus) {
  // per-word round trip: English -> Shavian -> English
  for (const w of (line.toLowerCase().match(/[a-z']+/g) || [])) {
    const sh = fw(w);
    totalWords++;
    const en = S.shavianToEnglish(sh, {}).english.toLowerCase().trim();
    if (en === w) exact++;
    else wrongList.push(`${w} -> ${en}`);
  }
}
console.log(`   prose round trip: ${exact}/${totalWords} words`);
ok(exact / totalWords >= 0.9, "prose round trip >= 90%", wrongList.slice(0, 15).join(", "));

section("5b. Whole-sentence round trip (word alignment)");
{
  let sTotal = 0, sExact = 0;
  const bad = [];
  for (const line of corpus) {
    const res = S.textToShavian(line, {});
    const rev = S.shavianToEnglish(res.shavian, {});
    const shTokens = res.shavian.trim().split(/\s+/);
    const enTokens = rev.english.trim().split(/\s+/);
    if (shTokens.length !== enTokens.length) {
      bad.push(`[align ${shTokens.length}/${enTokens.length}] ${line}`);
    }
    sTotal++;
    if (rev.english.replace(/\s+/g, " ").trim().toLowerCase() ===
        line.replace(/[^a-zA-Z']/g, "").replace(/\s+/g, " ").trim().toLowerCase()) sExact++;
  }
  console.log(`   sentences with identical token count: ${sTotal - bad.length}/${sTotal}`);
  ok(bad.length === 0, "sentence token counts preserved", bad.slice(0, 4).join(" | "));
}

section("6. Round trip over the 3000 most frequent English words");
const freqText = fs.readFileSync(path.join(ROOT, "data", "freq_en.txt"), "utf8");
const top = freqText.split("\n").slice(0, 3000).map((l) => l.split(" ")[0]).filter((w) => /^[a-z']+$/.test(w));
let t2 = 0, ok2 = 0; const bad2 = [];
for (const w of top) {
  const sh = fw(w);
  if (!sh) continue;
  t2++;
  const en = back(sh).toLowerCase().trim();
  if (en === w) ok2++;
  else bad2.push(`${w}->${en}`);
}
console.log(`   frequent words: ${ok2}/${t2} (${((ok2 / t2) * 100).toFixed(1)}%)`);
ok(ok2 / t2 >= 0.95, "frequent-word round trip >= 95%", bad2.slice(0, 25).join(", "));

section("7. Numbers, punctuation, abbreviations");
eq(fw("2024"), fw("twenty twenty-four"), "year 2024");
eq(fw("42"), fw("forty-two"), "42");
eq(fw("3.5"), fw("three point five"), "3.5");
eq(fw("the", { abbrev: true }), SH.They, "abbrev the -> They");
eq(fw("the", { abbrev: false }), C(SH.They, SH.Ado), "full the -> They-Ado");
ok(back(S.textToShavian("John lives in New York.", {}).shavian) === "john lives in new york.",
  "reverse sentence with names", back(S.textToShavian("John lives in New York.", {}).shavian));
ok(fw("Hello, world!").includes(","), "punctuation preserved", fw("Hello, world!"));

section("8. Out-of-vocabulary handling");
const oov = S.textToShavian("Zorblax and Quilmoth", {});
ok(oov.unknown.length === 2, "OOV words flagged", JSON.stringify(oov.unknown));
ok(oov.shavian.length > 0, "OOV words still transliterated", oov.shavian);
const seg = S.shavianToEnglish(C(SH.Up, SH.Err, SH.Oak, SH.Up));
ok(/^[a-z ]+$/i.test(seg.english.trim()) && seg.english.trim().length > 0, "unknown Shavian still decodes", JSON.stringify(seg.english));

section("9. Multi-pronunciation switching");
ok(fw("read") !== fw("read", { variants: { read: 1 } }), "read(1) vs read(2) differ");
ok(fw("I read the book") !== fw("I read the book", { variants: { read: 1 } }), "in-sentence variant switch");
ok(fw("record") !== fw("record", { variants: { record: 1 } }), "record noun vs verb");

section("10. Namer dot for proper nouns");
ok(/·[\u{10450}-\u{1047F}]+/u.test(fw("I met John yesterday")), "namer dot precedes the Shavian for mid-sentence John", fw("I met John yesterday"));
ok(!/\u00b7/.test(fw("john lives here")), "no namer dot on lowercase");
ok(!/\u00b7/.test(fw("The dog barks")), "no namer dot on sentence-initial 'The'");
ok(/\u00b7/.test(fw("I visited Paris last year")), "namer dot on Paris", fw("I visited Paris last year"));
ok(/\u00b7/.test(fw("John lives here", { nameAtStart: true })), "opt-in marks sentence-initial names");
ok(!/\u00b7/.test(fw("The dog barks", { nameAtStart: true })), "opt-in still spares common words");

section("11. Out-of-dictionary initialisms");
{
  const noDot = { namerDot: false };
  eq(fw("RP", noDot), S.phonesToShavian(S.spellOut("RP"), "us"), "RP = letter names R+P");
  eq(ipa("RP"), "/ˌɑːɹˈpiː/", "IPA RP");
  eq(fw("RP", { mode: "uk", namerDot: false }), C(SH.Are, SH.Peep, SH.Eat), "RP read in UK mode = Are-Peep-Eat");
  ok(S.textToShavian("RP", {}).unknown.length === 0, "RP not flagged unknown");
  ok(S.textToShavian("send it via ATM", {}).unknown.length === 0, "ATM handled without OOV flag");
  ok(S.textToShavian("rp", {}).unknown.indexOf("rp") >= 0, "lowercase rp still falls back to LTS guess");
  ok(S.textToShavian("ZZZ", {}).words[0].status === "spell", "ZZZ status is spell");
  ok(S.textToShavian("RP", {}).words[0].status === "spell", "RP status is spell");
  eq(S.spellOut("Q").map(x => x.p).join(" "), "K Y UW", "letter name Q is K-Y-UW");
  eq(fw("RP", noDot), C(SH.Ah, SH.Roar, SH.Peep, SH.Eat), "RP US = Ah-Roar-Peep-Eat");
}

console.log("\n" + "-".repeat(60));
if (fail) {
  console.log(`FAILED  ${fail} of ${pass + fail}`);
  failures.forEach((f) => console.log("  x " + f));
  process.exit(1);
} else {
  console.log(`ALL PASS  ${pass} checks`);
}