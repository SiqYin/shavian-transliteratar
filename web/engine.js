/* Shavian engine — pure logic, no DOM. Runs in the browser and in Node.
 *
 *  English text  ->  CMUdict phonemes  ->  Shavian (US or RP)  +  IPA
 *  Shavian text  ->  phonemes  ->  best English spelling (frequency-weighted
 *                     segmentation)  +  IPA
 *
 * Tables come from tools/build_data.py (Unicode U+10450..U+1047F, CMUdict 0.7b).
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module !== null && typeof module.exports !== "undefined") {
    module.exports = api;
  }
  if (root) { root.SHAVIAN = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var T = (typeof window !== "undefined" && window.SHAVIAN_TABLES) || (typeof SHAVIAN_TABLES !== "undefined" ? SHAVIAN_TABLES : null);
  var D = (typeof window !== "undefined" && window.SHAVIAN_DATA) || (typeof SHAVIAN_DATA !== "undefined" ? SHAVIAN_DATA : null);
  if (!T || !D) { throw new Error("SHAVIAN_TABLES / SHAVIAN_DATA not loaded"); }

  /* ------------------------------------------------------------------ data */
  var PH_CHARS = D.phChars;
  var PH_BY_CHAR = {};
  for (var i = 0; i < T.phones.length; i++) { PH_BY_CHAR[PH_CHARS[i]] = T.phones[i]; }
  var CHAR_BY_PH = {};
  for (var k = 0; k < T.phones.length; k++) { CHAR_BY_PH[T.phones[k]] = PH_CHARS[k]; }

  var VOWEL = {};
  T.vowels.forEach(function (v) { VOWEL[v] = true; });
  var SYLLABIC = {};
  T.syllabic.forEach(function (v) { SYLLABIC[v] = true; });
  var PH2SH_US = T.ph2sh_us, PH2SH_UK = T.ph2sh_uk;
  var IPA = T.ipa, IPA_LONG = {}, IPA_RED = T.ipaReduced;
  T.ipaLong.forEach(function (p) { IPA_LONG[p] = true; });

  var SH_CHARS = {};
  for (var ci = 0; ci < 0x80; ci++) { /* noop, keep ASCII range clean */ }
  var SH_TO_PH = {};          // Shavian char -> [[phone,...], ...]
  for (var ch in T.sh2ph) { SH_TO_PH[ch] = T.sh2ph[ch]; }
  var SH_SET = {};
  for (var ch2 in T.sh2ph) { SH_SET[ch2] = true; }
  // every letter must be decodable even if sh2ph lacks it
  T.letters.forEach(function (l) { if (!SH_SET[l.c]) { SH_SET[l.c] = true; } });

  var NAMER_DOT = T.namerDot;
  var ABBREV = T.abbrev;
  var ABBREV_REV = {};
  Object.keys(ABBREV).forEach(function (w) { ABBREV_REV[ABBREV[w]] = w; });

  /* --------------------------------------------------------------- lexicon */
  var lexMap = null, varMap = null, revMap = null;

  function parseLines(text) {
    var out = [], i = 0, n = text.length;
    while (i < n) {
      var j = text.indexOf("\n", i);
      if (j < 0) { j = n; }
      out.push(text.slice(i, j));
      i = j + 1;
    }
    return out;
  }

  function lexicon() {
    if (lexMap) { return lexMap; }
    lexMap = new Map();
    var lines = parseLines(D.words);
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i], sp = s.indexOf(" ");
      lexMap.set(s.slice(0, sp), s.slice(sp + 1));
    }
    return lexMap;
  }

  function variants() {
    if (varMap) { return varMap; }
    varMap = new Map();
    if (!D.variants) { return varMap; }
    var lines = parseLines(D.variants);
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i], sp = s.indexOf(" ");
      var w = s.slice(0, sp);
      var arr = varMap.get(w);
      if (!arr) { arr = []; varMap.set(w, arr); }
      arr.push(s.slice(sp + 1));
    }
    return varMap;
  }

  function reverse() {
    if (revMap) { return revMap; }
    revMap = new Map();
    var lines = parseLines(D.reverse);
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i], sp = s.indexOf(" ");
      var key = s.slice(0, sp);
      var cands = s.slice(sp + 1).split(",");
      var arr = new Array(cands.length);
      for (var c = 0; c < cands.length; c++) {
        var t = cands[c];
        var b = t.charCodeAt(t.length - 1);
        var bw = b < 58 ? b - 48 : b - 55;       // base36 digit
        arr[c] = { word: t.slice(0, t.length - 1), bucket: bw };
      }
      revMap.set(key, arr);
    }
    return revMap;
  }

  // D.common is the 3000-word frequency list, most frequent first; the rank
  // tells a sentence-starting "The" (rank 2) from a sentence-starting "John"
  // (rank 583) when nameAtStart is enabled.
  var NAME_RANK_CUTOFF = 500;
  var rankMap = null;
  function wordRank(w) {
    if (!rankMap) {
      rankMap = {};
      if (D.common) {
        var a = D.common.split(" ");
        for (var i = 0; i < a.length; i++) {
          if (a[i] && rankMap[a[i]] === undefined) { rankMap[a[i]] = i; }
        }
      }
    }
    var r = rankMap[w];
    return r === undefined ? -1 : r;
  }
  function nameLikely(w) {
    var r = wordRank(w);
    return r < 0 || r > NAME_RANK_CUTOFF;
  }

  /* ------------------------------------------------- phone (de)serialisation */
  function decodeEnc(enc) {
    var out = [], stress = 0;
    for (var i = 0; i < enc.length; i++) {
      var c = enc[i];
      if (c === "+") { stress = 1; continue; }
      if (c === "/") { stress = 2; continue; }
      var p = PH_BY_CHAR[c];
      if (!p) { continue; }
      out.push({ p: p, s: stress });
      stress = 0;
    }
    return out;
  }

  function encodePhones(phones) {
    var out = "";
    for (var i = 0; i < phones.length; i++) {
      if (phones[i].s === 1) { out += "+"; }
      else if (phones[i].s === 2) { out += "/"; }
      out += CHAR_BY_PH[phones[i].p];
    }
    return out;
  }

  function isVowel(p) { return !!VOWEL[p]; }

  /* ------------------------------------------------------------ IPA output
   * Stress marks sit at syllable onsets, so a post-vocalic consonant run has
   * to be split the way English actually syllabifies: C1 . C2V unless the tail
   * is a legal onset cluster (str-, spr-, skr-, spl-, s+liquid, ...).
   */
  // Splitting works on ARPAbet phones, not rendered IPA strings: CH and JH are
  // one phone each but render as two IPA characters (tʃ / dʒ).
  var P_LIQUIDS = { L: 1, R: 1, W: 1, Y: 1 };
  var P_GLIDES = { Y: 1, W: 1 };
  var P_SONORANT = { M: 1, N: 1, NG: 1, L: 1, R: 1 };
  var P_OBSTR = { P: 1, T: 1, K: 1, B: 1, D: 1, G: 1, F: 1, V: 1,
                  TH: 1, DH: 1, SH: 1, ZH: 1, HH: 1, CH: 1, JH: 1 };
  var P_ONSET3 = { STR: 1, SPR: 1, SKR: 1, SKW: 1, SPL: 1, SKL: 1 };

  /* Which two-consonant sequences may open an English syllable:
   *   sp st sk sm sn sl sw  (s + a non-sonorant)
   *   pr tr kr br dr gr fr vr THr SHr   (obstruent + liquid/glide)
   *   pj bj tw dw kw sw hj
   */
  function onset2(first, second) {
    if (first === "S") { return !P_SONORANT[second]; }
    if (P_OBSTR[first] && P_LIQUIDS[second]) { return true; }
    return false;
  }

  function onsetSplit(pend) {
    // index at which the next syllable starts (pend = array of phone codes)
    var n = pend.length;
    if (n <= 1) { return 0; }
    if (n >= 3 && P_ONSET3[pend.slice(n - 3).join("")]) { return n - 3; }
    var last = pend[n - 1], prev = pend[n - 2];
    if (P_GLIDES[last]) {                         // /pj/, /tw/, /kw/, /sw/ ...
      if (!P_SONORANT[prev] && !P_LIQUIDS[prev]) { return n - 2; }
      return n - 1;
    }
    if (onset2(prev, last)) { return n - 2; }
    return n - 1;
  }

  function isNucleus(phones, i, prevVowel) {
    var p = phones[i].p, n = phones.length;
    if (isVowel(p)) { return true; }
    if (!SYLLABIC[p] || i === 0) { return false; }
    if (i + 1 < n && isVowel(phones[i + 1].p)) { return false; }  // onset cluster
    if (!prevVowel) { return true; }                                 // after C
    return i + 1 === n;                                              // word-final (button)
  }

  function phonesToIPA(phones) {
    var out = "", pend = [], i, k;
    var prevVowel = false;
    function flushPending(mark) {
      if (!mark) {
        for (k = 0; k < pend.length; k++) { out += pend[k].t; }
        return;
      }
      var cut = onsetSplit(pend.map(function (x) { return x.p; }));
      for (k = 0; k < cut; k++) { out += pend[k].t; }
      out += mark;
      for (k = cut; k < pend.length; k++) { out += pend[k].t; }
    }
    for (i = 0; i < phones.length; i++) {
      var ph = phones[i].p, st = phones[i].s || 0;
      var nucleus = isNucleus(phones, i, prevVowel);
      if (nucleus) {
        flushPending(st === 1 ? "ˈ" : (st === 2 ? "ˌ" : ""));
        pend = [];
        out += ipaOf(ph, st);
        prevVowel = true;
      } else {
        var txt = ipaOf(ph, st);
        if (i > 0 && i + 1 === phones.length && SYLLABIC[ph] && isVowel(phones[i - 1].p)) { txt += "̩"; }
        pend.push({ p: ph, t: txt });
        prevVowel = false;
      }
    }
    flushPending("");
    return out;
  }

  function ipaOf(ph, st) {
    var base;
    if (st === 0 && IPA_RED[ph]) { base = IPA_RED[ph]; }
    else if (st > 0 && IPA_LONG[ph]) { base = IPA[ph] + "ː"; }
    else { base = IPA[ph]; }
    return base;
  }

  /* --------------------------------------------------- phones -> Shavian
   * US mode : General American, rhotic  (ER -> Array 𐑼, final r kept)
   * UK mode : Received Pronunciation, non-rhotic — a vowel + r is written
   *           with the matching ligature (Are/Or/Air/Ear/Ian) and a plain
   *           r is dropped, which is exactly what those letters are for.
   */
  var LIG = {}, RHOTIC_LIG = null;
  (function () {
    // IY + r is the NEAR lexical set in RP (here, near, year) and uses Ear;
    // the Ian ligature is reserved for /i.\u0259/ without an r.
    var lig = {}, rhot = { AA: "Are", AO: "Or", EH: "Air", ER: "Err", IH: "Ear", IY: "Ear" };
    for (var i = 0; i < T.letters.length; i++) {
      var l = T.letters[i];
      if (l.k === "ligature") { lig[l.n] = l.c; }
    }
    LIG = lig;
    RHOTIC_LIG = rhot;
  })();

  function phonesToShavian(phones, mode) {
    var uk = mode === "uk";
    var map = uk ? PH2SH_UK : PH2SH_US;
    var out = "", i;
    for (i = 0; i < phones.length; i++) {
      var p = phones[i].p, st = phones[i].s || 0;
      var next = i + 1 < phones.length ? phones[i + 1] : null;
      var after = i + 2 < phones.length ? phones[i + 2] : null;

      if (uk) {
        // vowel + r -> the matching ligature; when a vowel follows (very,
        // idea) the r is a linking r and is written explicitly
        var lig = RHOTIC_LIG[p];
        if (lig && next && next.p === "R") {
          out += LIG[lig];
          if (after && isVowel(after.p)) { out += map.R; }
          i++; continue;
        }
        // a bare r in RP is silent unless it links two vowels
        if (p === "R" && i > 0 && isVowel(phones[i - 1].p) && !(next && isVowel(next.p))) {
          continue;
        }
        if (p === "ER" || p === "AXR") { out += (st === 0 || p === "AXR") ? map.AX : LIG.Err; continue; }
      }
      // Y + UW is written with the single ligature Yew
      if (p === "Y" && next && next.p === "UW") { out += LIG.Yew; i++; continue; }
      if (p === "AH" && st === 0) { out += map.AX; continue; }   // schwa -> Ado
      var c = map[p];
      if (c) { out += c; }
    }
    return out;
  }

  /* --------------------------------------------------- phones -> Shavian */
  /* -------------------------------------------------------- letter -> sound
   * Fallback letter-to-sound rules for words that are not in CMUdict
   * (names, new words, foreign words).  Context codes follow the classic
   * NRL scheme:  # vowels+  : consonants*  ^ one consonant  . voiced
   * + front vowel/ending  % suffix  ' ' word edge.
   */
  var LTS_RULES = [
    [" ", "tion", " ", ["SH", "AH0", "N"]],
    [" ", "sion", " ", ["ZH", "AH0", "N"]],
    [" ", "sion", "%", ["ZH", "AH0", "N"]],
    ["#", "ough", "t", ["AO1"]],
    ["#", "ough", " ", ["OW1"]],
    ["#", "augh", "t", ["AO1"]],
    ["#", "augh", " ", ["AO1"]],
    ["#", "eigh", " ", ["EY1"]],
    [" ", "tion", "$", ["SH", "AH0", "N"]],
    [" ", "ough", "$", ["AH0", "F"]],
    ["^", "ture", " ", ["CH", "ER0"]],
    [" ", "ture", " ", ["CH", "ER0"]],
    ["#", "sure", " ", ["ZH", "ER0"]],
    [" ", "sure", " ", ["ZH", "ER0"]],
    [" ", "ology", " ", ["AA1", "L", "AH0", "JH", "IY0"]],
    [" ", "ology", "$", ["AA1", "L", "AH0", "JH", "IY0"]],
    [" ", "ia", " ", ["IY1", "AH0"]],
    [" ", "io", " ", ["AY1", "OW0"]],
    [" ", "iu", " ", ["IY1", "UW0"]],
    [":", "ia", " ", ["AH0"]],
    [":", "io", " ", ["AH0"]],
    [" ", "eous", " ", ["IY1", "AH0", "S"]],
    [" ", "cial", " ", ["SH", "AH0", "L"]],
    [" ", "tia", " ", ["SH", "AH0"]],
    [" ", "tio", " ", ["SH", "OW0"]],
    [" ", "ci", " ", ["S", "IY1"]],
    [" ", "ce", " ", ["S"]],
    [".", "e", "%", ["AH0"]],
    ["^", "e", " ", ["IY1"]],
    ["#", "e", " ", ["IY1"]],
    [" ", "e", " ", ["IY0"]],
    [" ", "tion", "%", ["SH", "AH0", "N"]],
    ["#", "o", " ", ["OW1"]],
    ["#", "a", " ", ["EY1"]],
    ["#", "er", " ", ["ER0"]],
    [":", "er", "%", ["ER0"]],
    [" ", "er", " ", ["ER0"]],
    ["#", "es", " ", ["IH0", "Z"]],
    ["^", "e", "#", ["EH1"]],
    ["^", "e", "$", ["IY1"]],
    ["#", "i", " ", ["AY1"]],
    ["#", "i", "$", ["AY1"]],
    ["#", "o", "$", ["OW1"]],
    ["#", "u", "$", ["UW1"]],
    ["#", "e", "$", ["IY1"]],
    ["#", "a", "$", ["EY1"]],
    ["^", "i", "#", ["IH1"]],
    ["^", "u", "#", ["AH1"]],
    ["^", "a", "#", ["AE1"]],
    ["^", "o", "#", ["AA1"]],
    [" ", "tch", " ", ["CH"]],
    [" ", "sch", " ", ["S", "K"]],
    [":", "ch", " ", ["CH"]],
    ["^", "ch", " ", ["K"]],
    [":", "ch", "%", ["K"]],
    [":", "ch", "#", ["CH"]],
    ["#", "s", " ", ["Z"]],
    ["#", "s", "%", ["Z"]],
    ["^", "s", " ", ["S"]],
    [" ", "sh", " ", ["SH"]],
    [" ", "th", " ", ["TH"]],
    [":", "th", " ", ["TH"]],
    ["#", "th", "%", ["DH"]],
    ["^", "th", " ", ["TH"]],
    [":", "th", "%", ["TH"]],
    [":", "dge", " ", ["JH"]],
    [":", "age", " ", ["IH0", "JH"]],
    [":", "ph", " ", ["F"]],
    ["#", "ph", " ", ["F"]],
    [":", "wh", " ", ["W"]],
    [" ", "wh", " ", ["W"]],
    ["#", "gn", " ", ["N"]],
    ["#", "kn", " ", ["N"]],
    ["#", "pn", " ", ["N"]],
    ["#", "ps", " ", ["S"]],
    ["#", "wr", " ", ["R"]],
    ["#", "mb", " ", ["M"]],
    ["#", "mn", " ", ["M"]],
    ["#", "rh", " ", ["R"]],
    [":", "le", " ", ["AH0", "L"]],
    ["#", "le", "$", ["AH0", "L"]],
    ["#", "les", "$", ["AH0", "L", "Z"]],
    ["#", "le", "%", ["AH0", "L"]],
    ["#", "ll", " ", ["L"]],
    ["#", "ss", " ", ["S"]],
    ["#", "ff", " ", ["F"]],
    ["#", "tt", " ", ["T"]],
    ["#", "pp", " ", ["P"]],
    ["#", "dd", " ", ["D"]],
    ["#", "nn", " ", ["N"]],
    ["#", "mm", " ", ["M"]],
    ["#", "rr", " ", ["R"]],
    ["#", "bb", " ", ["B"]],
    ["#", "gg", " ", ["G"]],
    ["#", "ck", " ", ["K"]],
    [":", "ce", " ", ["S"]],
    [":", "ge", " ", ["JH"]],
    [" ", "ea", "r", ["IY1"]],
    [" ", "ea", " ", ["IY1"]],
    [" ", "ai", " ", ["EY1"]],
    [" ", "ay", " ", ["EY1"]],
    [" ", "oa", " ", ["OW1"]],
    [" ", "oe", " ", ["OW1"]],
    [" ", "oo", " ", ["UW1"]],
    [" ", "ou", " ", ["AW1"]],
    [" ", "ow", " ", ["AW1"]],
    [" ", "oi", " ", ["OY1"]],
    [" ", "oy", " ", ["OY1"]],
    [" ", "au", " ", ["AO1"]],
    [" ", "aw", " ", ["AO1"]],
    [" ", "ie", " ", ["IY1"]],
    [" ", "ei", " ", ["EY1"]],
    [" ", "ue", " ", ["UW1"]],
    [" ", "ui", " ", ["UW1"]],
    [" ", "eu", " ", ["Y", "UW1"]],
    [" ", "ew", " ", ["UW1"]],
    [" ", "ey", " ", ["IY1"]],
    [" ", "ar", " ", ["AA1", "R"]],
    [" ", "or", " ", ["AO1", "R"]],
    [" ", "ir", " ", ["ER1"]],
    [" ", "ur", " ", ["ER1"]],
    [":", "ar", "$", ["EH1", "R"]],
    [":", "or", "$", ["AO1", "R"]],
    [":", "er", "$", ["ER0"]],
    [":", "ir", "$", ["ER1"]],
    [":", "ur", "$", ["ER1"]],
    [" ", "ng", " ", ["NG"]],
    [":", "ng", "$", ["NG"]],
    [":", "nk", " ", ["NG", "K"]],
    [" ", "qu", " ", ["K", "W"]],
    [" ", "x", " ", ["K", "S"]],
    [" ", "h", " ", ["HH"]],
    [" ", "f", " ", ["F"]],
    [" ", "v", " ", ["V"]],
    [" ", "z", " ", ["Z"]],
    [" ", "j", " ", ["JH"]],
    [" ", "g", " ", ["G"]],
    [" ", "b", " ", ["B"]],
    [" ", "d", " ", ["D"]],
    [" ", "p", " ", ["P"]],
    [" ", "t", " ", ["T"]],
    [" ", "k", " ", ["K"]],
    [" ", "c", " ", ["K"]],
    [" ", "m", " ", ["M"]],
    [" ", "n", " ", ["N"]],
    [" ", "l", " ", ["L"]],
    [" ", "r", " ", ["R"]],
    [" ", "s", " ", ["S"]],
    [" ", "w", " ", ["W"]],
    [" ", "y", " ", ["Y"]],
    [" ", "a", " ", ["AE1"]],
    [" ", "e", " ", ["EH1"]],
    [" ", "i", " ", ["IH1"]],
    [" ", "o", " ", ["AA1"]],
    [" ", "u", " ", ["AH1"]],
    ["^", "a", " ", ["EY1"]],
    ["^", "i", " ", ["AY1"]],
    ["^", "o", " ", ["OW1"]],
    ["^", "u", " ", ["AW1"]],
    [" ", "h", "$", ["HH"]],
    ["^", "y", " ", ["Y"]],
    [" ", "y", "$", ["IY0"]],
    ["#", "y", "$", ["AY1"]],
    [" ", "x", "%", ["K", "S"]],
    [":", "s", "%", ["Z"]],
    [":", "g", "e", ["JH"]],
    [" ", "ed", "$", ["D"]],
    [":", "ed", "$", ["T"]],
    [":", "ed", "#", ["D"]],
    [":", "es", "$", ["Z"]],
    [":", "es", "#", ["Z"]],
    [":", "e", "$", ["IY0"]],
    [" ", "s", "$", ["Z"]],
    [" ", "s", "#", ["Z"]],
    [":", "s", "#", ["S"]],
    [" ", "ally", " ", ["AH0", "L", "IY0"]],
    [" ", "ly", " ", ["L", "IY0"]],
    [":", "ing", " ", ["IH0", "NG"]],
    [":", "ing", "$", ["IH0", "NG"]],
    [":", "ion", " ", ["AH0", "N"]],
    [":", "ious", " ", ["IY0", "AH0", "S"]],
    [" ", "ious", " ", ["IY0", "AH0", "S"]],
    [" ", "eous", " ", ["IY0", "AH0", "S"]],
    [" ", "uous", " ", ["UW0", "AH0", "S"]],
    [" ", "ance", " ", ["AH0", "N", "S"]],
    [" ", "ence", " ", ["AH0", "N", "S"]],
    [":", "ance", " ", ["AH0", "N", "S"]],
    [":", "ence", " ", ["AH0", "N", "S"]],
    [" ", "able", " ", ["EY0", "B", "AH0", "L"]],
    [" ", "ible", " ", ["AH0", "B", "AH0", "L"]],
    [" ", "ment", " ", ["M", "AH0", "N", "T"]],
    [":", "ment", " ", ["M", "AH0", "N", "T"]],
    [" ", "ness", " ", ["N", "AH0", "S"]],
    [":", "ness", " ", ["N", "AH0", "S"]],
    [" ", "ful", " ", ["F", "AH0", "L"]],
    [":", "ful", " ", ["F", "AH0", "L"]],
    [" ", "less", " ", ["L", "AH0", "S"]],
    [":", "less", " ", ["L", "AH0", "S"]],
    [" ", "ous", " ", ["AH0", "S"]],
    [":", "ous", " ", ["AH0", "S"]],
    [" ", "ity", " ", ["IH0", "T", "IY0"]],
    [":", "ity", " ", ["IH0", "T", "IY0"]],
    [" ", "ive", " ", ["IH0", "V"]],
    [":", "ive", " ", ["IH0", "V"]],
    [" ", "ure", " ", ["Y", "UH1", "R"]],
    [":", "ure", " ", ["Y", "UH1", "R"]],
    [" ", "ate", " ", ["EY1", "T"]],
    [" ", "ise", " ", ["AY1", "Z"]],
    [" ", "ize", " ", ["AY1", "Z"]],
    [" ", "ise", "%", ["AY0", "Z"]],
    [" ", "ize", "%", ["AY0", "Z"]],
    [" ", "ism", " ", ["IH1", "Z", "AH0", "M"]],
    [" ", "ist", " ", ["IH0", "S", "T"]],
    [" ", "ify", " ", ["IH0", "F", "AY2"]],
    [" ", "ate", "$", ["EY1", "T"]],
    [" ", "age", "$", ["IH0", "JH"]],
    [" ", "able", "$", ["EY0", "B", "AH0", "L"]],
    [" ", "ible", "$", ["AH0", "B", "AH0", "L"]],
    [" ", "acy", " ", ["AE0", "S", "IY0"]],
    [":", "acy", " ", ["AE0", "S", "IY0"]],
    [" ", "ograph", " ", ["AA1", "G", "R", "AE2", "F"]],
    [" ", "phone", " ", ["F", "OW1", "N"]],
    [" ", "tial", " ", ["SH", "AH0", "L"]],
    [" ", "ant", " ", ["AH0", "N", "T"]],
    [" ", "ent", " ", ["AH0", "N", "T"]],
    [":", "ant", " ", ["AH0", "N", "T"]],
    [":", "ent", " ", ["AH0", "N", "T"]],
    [":", "ism", " ", ["IH1", "Z", "AH0", "M"]],
    [":", "ist", " ", ["IH0", "S", "T"]],
    [":", "ify", " ", ["IH0", "F", "AY2"]],
    [":", "ize", " ", ["AY1", "Z"]],
    [":", "ate", " ", ["EY1", "T"]],
    [":", "ise", " ", ["AY1", "Z"]],
    [":", "ily", " ", ["AH0", "L", "IY0"]],
    [":", "ology", " ", ["AA1", "L", "AH0", "JH", "IY0"]],
    [":", "ology", "$", ["AA1", "L", "AH0", "JH", "IY0"]],
    [" ", "ch", " ", ["CH"]],
    [" ", "ph", " ", ["F"]],
    [" ", "ck", " ", ["K"]],
    [" ", "gh", " ", ["G"]],
    [":", "gh", " ", ["G"]],
    [" ", "kn", " ", ["N"]],
    [" ", "wr", " ", ["R"]],
    [" ", "mb", " ", ["M"]],
    [" ", "ae", " ", ["EY1"]],
    [" ", "aa", " ", ["AA1"]],
    [" ", "ee", " ", ["IY1"]],
    [" ", "ao", " ", ["AW1"]],
    [" ", "ai", "$", ["EY1"]],
    [" ", "ay", "$", ["EY1"]],
    [" ", "ea", "$", ["IY1"]],
    [" ", "ee", "$", ["IY1"]],
    [" ", "oo", "$", ["UW1"]],
    [" ", "ou", "$", ["AW1"]],
    [" ", "ow", "$", ["OW1"]],
    [" ", "oa", "$", ["OW1"]],
    [" ", "ue", "$", ["UW1"]],
    [" ", "ie", "$", ["IY1"]],
    [" ", "ei", "$", ["EY1"]],
    [" ", "ar", "$", ["AA1", "R"]],
    [" ", "or", "$", ["AO1", "R"]],
    [" ", "er", "$", ["ER0"]],
    [" ", "el", "$", ["AH0", "L"]],
    [" ", "al", "$", ["AH0", "L"]],
    [" ", "le", " ", ["AH0", "L"]],
    [":", "le", "$", ["AH0", "L"]],
    [":", "es", "$", ["IH0", "Z"]],
    [":", "es", "%", ["IH0", "Z"]],
    [" ", "s", "%", ["S"]],
    [" ", "s", "$", ["S"]],
    [" ", "e", "%", ["AH0"]],
    [" ", "e", "$", ["IY0"]],
    [" ", "y", " ", ["IY0"]],
    [":", "y", "$", ["IY0"]],
    [" ", "n", "#", ["NG"]],
    [":", "n", "#", ["NG"]],
    [":", "l", "#", ["L"]],
    [":", "m", "#", ["M"]],
    [":", "r", "#", ["R"]],
    [":", "b", "#", ["B"]],
    [":", "d", "#", ["D"]],
    [":", "g", "#", ["G"]],
    [":", "p", "#", ["P"]],
    [":", "t", "#", ["T"]],
    [":", "k", "#", ["K"]],
    [":", "f", "#", ["F"]],
    [":", "v", "#", ["V"]],
    [":", "c", "#", ["K"]],
    [":", "x", "#", ["K", "S"]],
    [":", "h", "#", ["HH"]],
    [":", "j", "#", ["JH"]],
    [":", "w", "#", ["W"]],
    [":", "z", "#", ["Z"]],
    ["#", "a", "%", ["AH0"]],
    ["#", "e", "%", ["AH0"]],
    ["#", "i", "%", ["AH0"]],
    ["#", "o", "%", ["AH0"]],
    ["#", "u", "%", ["AH0"]],
    ["#", "u", " ", ["AW1"]],
    [" ", "a", "%", ["EY0"]],
    [" ", "e", "%", ["IY0"]],
    [" ", "i", "%", ["AH0"]],
    [" ", "o", "%", ["OW0"]],
    [" ", "u", "%", ["AH0"]],
    ["^", "a", "%", ["AH0"]],
    ["^", "e", "%", ["AH0"]],
    ["^", "i", "%", ["AH0"]],
    ["^", "o", "%", ["AH0"]],
    ["^", "u", "%", ["AH0"]],
    ["^", "a", "$", ["EY1"]],
    ["^", "i", "$", ["AY1"]],
    ["^", "o", "$", ["OW1"]],
    ["^", "u", "$", ["UW1"]],
    ["^", "a", " ", ["AE1"]],
    ["^", "e", " ", ["EH1"]],
    ["^", "i", " ", ["IH1"]],
    ["^", "o", " ", ["AA1"]],
    ["^", "u", " ", ["AH1"]],
    ["#", "oo", "$", ["UW1"]],
    ["#", "ee", "$", ["IY1"]],
    ["#", "ea", "$", ["IY1"]],
    ["#", "ai", "$", ["EY1"]],
    ["#", "ou", "$", ["AW1"]],
    ["#", "oa", "$", ["OW1"]],
    [" ", "ie", "$", ["AY1"]],
    [" ", "ui", "$", ["UW1"]],
    [" ", "au", "$", ["AO1"]],
    [" ", "aw", "$", ["AO1"]],
    [" ", "oi", "$", ["OY1"]],
    [" ", "oy", "$", ["OY1"]],
    [":", "ar", " ", ["AA1", "R"]],
    [":", "or", " ", ["AO1", "R"]],
    [":", "er", " ", ["ER0"]],
    [":", "ir", " ", ["ER1"]],
    [":", "ur", " ", ["ER1"]],
    [":", "y", " ", ["Y"]],
    ["#", "e", "%", ["IY0"]],
    ["#", "i", "%", ["AY0"]],
    ["#", "o", "%", ["OW0"]],
    [":", "i", "$", ["AY0"]],
    [":", "o", "$", ["OW0"]],
    [":", "u", "$", ["UW1"]],
    [":", "a", "$", ["EY1"]],
    [":", "o", "$", ["OW1"]],
    [":", "i", " ", ["AY1"]],
    [":", "u", " ", ["AW1"]],
    [" ", "h", "%", ["HH"]],
    [":", "h", "%", ["HH"]],
    [":", "ck", "$", ["K"]],
    [":", "ch", "$", ["CH"]],
    [":", "sh", "$", ["SH"]],
    [":", "th", "$", ["TH"]],
    [" ", "a", "$", ["EY1"]],
    [" ", "i", "$", ["AY1"]],
    [" ", "o", "$", ["OW1"]],
    [" ", "u", "$", ["UW1"]],
    [" ", "e", "$", ["IY1"]],
    [" ", "a", " ", ["EY1"]],
    [" ", "i", " ", ["AY1"]],
    [" ", "o", " ", ["OW1"]],
    [" ", "u", " ", ["AW1"]],
    [":", "a", " ", ["EY1"]],
    [":", "o", " ", ["OW1"]],
    [":", "e", " ", ["IY1"]],
    [":", "a", "%", ["EY1"]],
    [":", "i", "%", ["AY1"]],
    [":", "o", "%", ["OW1"]],
    [":", "u", "%", ["AW1"]],
    [":", "e", "%", ["IY0"]],
    [":", "ck", " ", ["K"]],
    [":", "sh", " ", ["SH"]],
    [":", "kn", " ", ["N"]],
    [":", "wr", " ", ["R"]],
    [":", "mb", " ", ["M"]],
    [":", "gn", " ", ["N"]],
    [":", "pn", " ", ["N"]],
    [":", "ps", " ", ["S"]],
    [":", "nk", "$", ["NG", "K"]],
    [":", "qu", "$", ["K", "W"]],
    [":", "tch", "$", ["CH"]],
    [":", "dge", "$", ["JH"]],
    [":", "x", "$", ["K", "S"]],
    [":", "se", "$", ["S"]],
    [":", "ss", "$", ["S"]],
    [":", "ll", "$", ["L"]],
    [":", "tt", "$", ["T"]],
    [":", "dd", "$", ["D"]],
    [":", "ff", "$", ["F"]],
    [":", "pp", "$", ["P"]],
    [":", "mm", "$", ["M"]],
    [":", "nn", "$", ["N"]],
    [":", "rr", "$", ["R"]],
    [":", "gg", "$", ["G"]],
    [":", "bb", "$", ["B"]],
    [":", "c", "$", ["K"]],
    [":", "q", "$", ["K"]],
    [":", "z", "$", ["Z"]],
    [":", "j", "$", ["JH"]],
    [":", "v", "$", ["V"]],
    [":", "w", "$", ["W"]],
    [":", "h", "$", ["HH"]],
    [":", "t", "$", ["T"]],
    [":", "p", "$", ["P"]],
    [":", "k", "$", ["K"]],
    [":", "b", "$", ["B"]],
    [":", "d", "$", ["D"]],
    [":", "m", "$", ["M"]],
    [":", "n", "$", ["N"]],
    [":", "l", "$", ["L"]],
    [":", "r", "$", ["R"]],
    [":", "s", "$", ["S"]],
    ["^", "y", "$", ["AY1"]],
    [" ", "y", "$", ["IY0"]]
  ];

  function isVowelLetter(c) { return "aeiouy".indexOf(c) >= 0; }
  function isConsLetter(c) { return /[bcdfghjklmnpqrstvwxz]/.test(c); }
  function isVoiced(c) { return /[bdvgjlmnrwz]/.test(c); }
  function isFront(c) { return /[eiy]/.test(c); }

  function matchLeft(ctx, left) {
    // ctx is a pattern over the already-consumed letters
    if (ctx === " ") { return left.length === 0; }
    if (ctx === "#") { for (var i = 0; i < left.length; i++) { if (!isVowelLetter(left[i])) { return false; } } return left.length > 0; }
    if (ctx === ":") { return true; }
    if (ctx === "^") { return left.length > 0 && isConsLetter(left[left.length - 1]); }
    if (ctx === ".") { return left.length > 0 && isVoiced(left[left.length - 1]); }
    if (ctx === "+") { return left.length > 0 ? isFront(left[left.length - 1]) : true; }
    if (ctx === "%") {
      var tail = left.slice(-3);
      return /(^|[^a-z])(e|es|ed|er|ing|ely|ies|y)$/.test(tail) || /(es|ed|er|ing|ely|ies)$/.test(tail);
    }
    return false;
  }

  function matchRight(ctx, right) {
    if (ctx === " ") { return right.length === 0; }
    if (ctx === "#") { for (var i = 0; i < right.length; i++) { if (!isVowelLetter(right[i])) { return false; } } return right.length > 0; }
    if (ctx === ":") { return true; }
    if (ctx === "^") { return right.length > 0 && isConsLetter(right[0]); }
    if (ctx === ".") { return right.length > 0 && isVoiced(right[0]); }
    if (ctx === "+") { return right.length > 0 ? isFront(right[0]) : false; }
    if (ctx === "%") {
      return /^(e|es|ed|er|ing|ely|ies|y)/.test(right);
    }
    return false;
  }

  function lts(word) {
    var w = word.toLowerCase().replace(/[^a-z']/g, "");
    if (!w) { return null; }
    var phones = [], i = 0, guard = 0;
    while (i < w.length && guard++ < 400) {
      var left = w.slice(0, i), right = w.slice(i);
      var matched = null;
      for (var r = 0; r < LTS_RULES.length; r++) {
        var rule = LTS_RULES[r];
        if (right.indexOf(rule[1]) === 0 && matchLeft(rule[0], left) && matchRight(rule[2], right.slice(rule[1].length))) {
          matched = rule;
          break;
        }
      }
      if (matched) {
        for (var q = 0; q < matched[3].length; q++) {
          phones.push({ p: matched[3][q], s: parseInt(matched[3][q].slice(1), 10) || 0 });
        }
        i += matched[1].length;
      } else {
        var ch = w[i];
        var ph = "a e i o u y".indexOf(ch) >= 0 ? "AH0" : (/[bcdfghjklmnpqrstvwxz]/.test(ch) ? "T" : null);
        if (ph) { phones.push({ p: ph, s: 0 }); }
        i += 1;
      }
    }
    return phones;
  }

  /* ------------------------------------------------------------- lookup */
  function lookup(wordRaw) {
    var word = wordRaw.toLowerCase().replace(/[’‘]/g, "'");
    var lex = lexicon();
    var enc = lex.get(word);
    if (enc === undefined) {
      var noAp = word.replace(/'/g, "");
      if (lex.has(noAp)) { enc = lex.get(noAp); word = noAp; }
    }
    if (enc === undefined) {
      var noHy = word.replace(/-/g, "");
      if (lex.has(noHy)) { enc = lex.get(noHy); word = noHy; }
    }
    if (enc === undefined) { return null; }
    var res = { phones: decodeEnc(enc), variants: [] };
    var vm = variants();
    var extra = vm.get(word);
    if (extra) {
      for (var i = 0; i < extra.length; i++) {
        var dec = decodeEnc(extra[i]);
        if (encodePhones(dec) !== encodePhones(res.phones)) { res.variants.push(dec); }
      }
    }
    res.enc = encodePhones(res.phones);
    res.variantEncs = res.variants.map(encodePhones);
    return res;
  }

  function chooseVariant(wordRaw, variantIndex) {
    var r = lookup(wordRaw);
    if (!r) { return null; }
    if (variantIndex > 0 && r.variants[variantIndex - 1]) {
      return { phones: r.variants[variantIndex - 1], variants: r.variants, chosen: variantIndex };
    }
    return { phones: r.phones, variants: r.variants, chosen: 0 };
  }

  /* ---------------------------------------------------------- number words */
  var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
    "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  var ORD = { "1": "first", "2": "second", "3": "third", "5": "fifth", "8": "eighth", "9": "ninth", "12": "twelfth" };

  function intToWords(n) {
    if (n < 20) { return ONES[n]; }
    if (n < 100) { return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
    if (n < 1000) { return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + intToWords(n % 100) : ""); }
    var scales = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]], parts = [];
    for (var i = 0; i < scales.length; i++) {
      var f = scales[i][0];
      if (n >= f) {
        parts.push(intToWords(Math.floor(n / f)) + " " + scales[i][1]);
        n %= f;
      }
    }
    if (n > 0) { parts.push(intToWords(n)); }
    return parts.join(" ");
  }

  function ordinalWord(n) {
    var w = intToWords(n), parts = w.split(" ");
    var last = parts[parts.length - 1];
    var hy = last.split("-");
    var tail = hy[hy.length - 1];
    if (ORD[tail] && tail !== "second") { tail = ORD[tail]; }
    else if (tail === "one") { tail = "first"; }
    else if (tail.endsWith("y")) { tail = tail.slice(0, -1) + "ieth"; }
    else { tail = tail + "th"; }
    hy[hy.length - 1] = tail;
    return parts.join(" ") + " " + hy.join("-");
  }

  function numberToWords(tok) {
    var m = /^(\d+)(?:st|nd|rd|th)?$/.exec(tok);
    if (!m) { return null; }
    var suffix = /[a-z]$/.test(tok) ? tok.slice(-2) : "";
    var n = parseInt(m[1], 10);
    if (suffix === "st" || suffix === "nd" || suffix === "rd" || suffix === "th") { return ordinalWord(n); }
    return intToWords(n);
  }

  /* ------------------------------------------- letter names (RP, BBC, CEO)
   * Words absent from CMUdict that are written entirely in capitals are
   * initialisms and are pronounced by spelling the letters out, the way every
   * dictionary reader handles "RP", "ATM" or an unknown ticker symbol. This is
   * a determinate pronunciation, not an LTS guess, so it never raises the OOV
   * flag. Names match the single-letter entries of CMUdict (US: Z = /ziː/).
   */
  var LETTER_NAMES = {
    a: [{ p: "EY", s: 1 }],
    b: [{ p: "B", s: 0 }, { p: "IY", s: 1 }],
    c: [{ p: "S", s: 0 }, { p: "IY", s: 1 }],
    d: [{ p: "D", s: 0 }, { p: "IY", s: 1 }],
    e: [{ p: "IY", s: 1 }],
    f: [{ p: "EH", s: 1 }, { p: "F", s: 0 }],
    g: [{ p: "JH", s: 0 }, { p: "IY", s: 1 }],
    h: [{ p: "EY", s: 1 }, { p: "CH", s: 0 }],
    i: [{ p: "AY", s: 1 }],
    j: [{ p: "JH", s: 0 }, { p: "EY", s: 1 }],
    k: [{ p: "K", s: 0 }, { p: "EY", s: 1 }],
    l: [{ p: "EH", s: 1 }, { p: "L", s: 0 }],
    m: [{ p: "EH", s: 1 }, { p: "M", s: 0 }],
    n: [{ p: "EH", s: 1 }, { p: "N", s: 0 }],
    o: [{ p: "OW", s: 1 }],
    p: [{ p: "P", s: 0 }, { p: "IY", s: 1 }],
    q: [{ p: "K", s: 0 }, { p: "Y", s: 0 }, { p: "UW", s: 1 }],
    r: [{ p: "AA", s: 1 }, { p: "R", s: 0 }],
    s: [{ p: "EH", s: 1 }, { p: "S", s: 0 }],
    t: [{ p: "T", s: 0 }, { p: "IY", s: 1 }],
    u: [{ p: "Y", s: 0 }, { p: "UW", s: 1 }],
    v: [{ p: "V", s: 0 }, { p: "IY", s: 1 }],
    w: [{ p: "D", s: 0 }, { p: "AH", s: 1 }, { p: "B", s: 0 },
        { p: "AH", s: 0 }, { p: "L", s: 0 }, { p: "Y", s: 0 }, { p: "UW", s: 0 }],
    x: [{ p: "EH", s: 1 }, { p: "K", s: 0 }, { p: "S", s: 0 }],
    y: [{ p: "W", s: 0 }, { p: "AY", s: 1 }],
    z: [{ p: "Z", s: 0 }, { p: "IY", s: 1 }]
  };

  function isInitialism(piece) {
    return /^[A-Z]+$/.test(piece);
  }

  function spellOut(piece) {
    var letters = piece.toLowerCase().split(""), out = [], n = letters.length;
    for (var i = 0; i < n; i++) {
      var name = LETTER_NAMES[letters[i]];
      if (!name) { return null; }
      // stress pattern of a string of letter names: secondary ... primary,
      // matching CMUdict entries like bbc = B IY2 B IY0 S IY1
      var level = n === 1 ? 1 : (i === n - 1 ? 1 : (i === 0 ? 2 : 0));
      var stressed = false;
      for (var j = 0; j < name.length; j++) {
        var s = name[j].s;
        var ns;
        if (s > 0 && !stressed) { ns = level; stressed = true; }
        else { ns = 0; }
        out.push({ p: name[j].p, s: ns });
      }
    }
    return out;
  }

  /* ------------------------------------------------- English -> Shavian */
  var TOKEN_RE = /([A-Za-zÀ-ɏ]+(?:['’-][A-Za-zÀ-ɏ]+)*)|(\d+(?:[.,:]\d+)*)|(\s+)|([^\s])/g;

  function textToShavian(text, opts) {
    opts = opts || {};
    var mode = opts.mode === "uk" ? "uk" : "us";
    var useAbbrev = !!opts.abbrev;
    var namerDot = opts.namerDot !== false;
    var variantPick = opts.variants || {};      // {lowercased word: variant index}
    var out = "", words = [], unknown = [];
    var m, token, isSentenceStart = true;
    TOKEN_RE.lastIndex = 0;
    var firstRealWord = true;
    while ((m = TOKEN_RE.exec(text)) !== null) {
      if (m[3] !== undefined) { out += m[3]; continue; }
      if (m[1] !== undefined) {
        token = m[1];
        var spelled = token;
        var ch0 = token.charAt(0);
        var rest = token.slice(1);
        var isUpper = ch0 === ch0.toUpperCase() && /[A-Za-z]/.test(ch0);
        var lookupKey = token.toLowerCase().replace(/[\u2019]/g, "'");
        if (useAbbrev && ABBREV[lookupKey]) {
          var ab = ABBREV[lookupKey];
          out += ab;
          words.push({ src: token, shavian: ab, abbrev: true, ipa: "", status: "abbrev" });
          firstRealWord = false;
          continue;
        }
        // split hyphenated words
        var pieces = spelled.split("-");
        var built = "", builtIpa = [], info = null;
        for (var pi = 0; pi < pieces.length; pi++) {
          var piece = pieces[pi];
          var lowPiece = piece.toLowerCase().replace(/[\u2019]/g, "'");
          var picked = chooseVariant(piece, variantPick[lowPiece] || 0);
          var status = "dict";
          if (!picked && isInitialism(piece)) {
            // out-of-dictionary initialism (RP, ATM, unknown ticker): spell it
            var spelledPhones = spellOut(piece);
            if (spelledPhones) {
              picked = { phones: spelledPhones, variants: [], chosen: 0 };
              status = "spell";
            }
          }
          if (!picked) {
            var g = lts(lowPiece);
            picked = { phones: g || [], variants: [], chosen: 0 };
            status = "guess";
            if (unknown.indexOf(lowPiece) < 0) { unknown.push(lowPiece); }
          }
          var sh = phonesToShavian(picked.phones, mode);
          built += (pi ? "-" : "") + sh;
          builtIpa.push(phonesToIPA(picked.phones));
          info = {
            src: token, word: piece, shavian: sh, ipa: phonesToIPA(picked.phones),
            status: status, phones: picked.phones, variants: picked.variants,
            chosen: picked.chosen
          };
        }
        var propWord = false;
        if (isUpper && namerDot) {
          // mid-sentence capitals are names (the lone pronoun "I" is the
          // exception); ALL-CAPS acronyms are kept as names too; a capitalised
          // sentence-initial word only counts with nameAtStart and when it is
          // not among the most frequent common words
          var midSentence = !firstRealWord;
          var allCaps = /^[A-Z]{2,}/.test(token);
          propWord = midSentence ? lookupKey !== "i"
            : (allCaps || (opts.nameAtStart && nameLikely(lookupKey)));
        }
        var item = {
          src: token, shavian: built, ipa: builtIpa.join("-"),
          status: info.status, proper: propWord,
          phones: info.phones, variants: info.variants, chosen: info.chosen,
          word: info.word
        };
        // the namer dot only marks the following token as a proper name;
        // the name itself is still written in Shavian, like every other word
        out += (propWord ? NAMER_DOT : "") + built;
        words.push(item);
        firstRealWord = false;
        continue;
      }
      if (m[2] !== undefined) {
        var numTok = m[2];
        var spelledNum = numToWordsSafe(numTok);
        if (spelledNum) {
          var builtNum = "", ipaNum = [];
          var partsNum = spelledNum.split(/(\s+|-)/);
          for (var ni = 0; ni < partsNum.length; ni++) {
            var pt = partsNum[ni];
            if (!/^[A-Za-z]+$/.test(pt)) { builtNum += pt; continue; }
            var pk = chooseVariant(pt, 0);
            var pph = pk ? pk.phones : (lts(pt) || []);
            builtNum += phonesToShavian(pph, mode);
            ipaNum.push(phonesToIPA(pph));
          }
          out += builtNum;
          words.push({ src: numTok, spoken: spelledNum, shavian: builtNum, ipa: ipaNum.join(" "), status: "num" });
          firstRealWord = false;
        } else { out += numTok; }
        continue;
      }
      out += m[4];
      if (/[.!?]/.test(m[4])) { firstRealWord = true; }
    }
    var ipaSentence = words.filter(function (w) { return w.ipa; })
      .map(function (w) { return "/" + w.ipa + "/"; }).join(" ");
    return { shavian: out, words: words, ipa: ipaSentence, unknown: unknown };
  }

  function numToWordsSafe(tok) {
    if (/^\d{4}$/.test(tok)) {              // year: nineteen eighty-four
      var hi = Math.floor(parseInt(tok, 10) / 100), lo = parseInt(tok, 10) % 100;
      return intToWords(hi) + " " + intToWords(lo);
    }
    if (/^\d+[.,]\d+$/.test(tok)) {
      var bits = tok.split(/([.,])/);
      var res = [];
      for (var i = 0; i < bits.length; i++) {
        if (bits[i] === "." || bits[i] === ",") { res.push(bits[i] === "." ? "point" : "and"); }
        else { res.push(intToWords(parseInt(bits[i], 10))); }
      }
      return res.join(" ");
    }
    return numberToWords(tok);
  }

  /* -------------------------------------------------- Shavian -> English */
  function shavianToPhoneSets(sw) {
    // returns array of alternatives: each is an array of {p, s}
    var chars = Array.from(sw);
    var out = [];
    function rec(i, acc) {
      if (i >= chars.length) { out.push(acc.slice()); return; }
      if (out.length > 24) { return; }
      var c = chars[i];
      var opts = SH_TO_PH[c];
      if (!opts) {
        if (/[A-Za-z]/.test(c)) { rec(i + 1, acc); }     // stray latin: ignore
        else { rec(i + 1, acc); }
        return;
      }
      // Yea + Yew -> the Yew ligature alone
      if (c === "\u{10458}" && chars[i + 1] === "\u{1047F}") {
        rec(i + 2, acc.concat([{ p: "UW", s: 0 }]));
        return;
      }
      for (var k = 0; k < opts.length; k++) {
        var seq = opts[k];
        var add = [];
        for (var j = 0; j < seq.length; j++) { add.push({ p: seq[j], s: 0 }); }
        rec(i + 1, acc.concat(add));
      }
    }
    rec(0, []);
    return out;
  }

  var MAXPH = 26;

  function keyOf(phones) {
    var s = "";
    for (var i = 0; i < phones.length; i++) { s += CHAR_BY_PH[phones[i].p]; }
    return s;
  }

  function segment(phones) {
    var rev = reverse();
    var idx = keyOf(phones);
    var n = idx.length;
    var best = new Float64Array(n + 1).fill(-Infinity);
    var from = new Int32Array(n + 1).fill(-1);
    var pick = new Array(n + 1);
    best[0] = 0;
    for (var i = 0; i < n; i++) {
      if (best[i] === -Infinity) { continue; }
      var limit = Math.min(MAXPH, n - i);
      for (var len = 1; len <= limit; len++) {
        var key = idx.substr(i, len);
        var cands = rev.get(key);
        if (!cands) { continue; }
        var c = cands[0];
        var sc = best[i] + c.bucket * 0.85 - 3;
        if (sc > best[i + len]) {
          best[i + len] = sc;
          from[i + len] = i;
          pick[i + len] = { word: c.word, bucket: c.bucket, len: len };
        }
      }
      // fallback: skip one unknown phone at heavy cost
      if (best[i] - 8 > best[i + 1]) {
        best[i + 1] = best[i] - 8;
        from[i + 1] = i;
        pick[i + 1] = null;
      }
    }
    var out = [], pos = n, anyUnknown = false;
    while (pos > 0) {
      var p = from[pos];
      if (p < 0) { break; }
      if (pick[pos]) { out.unshift({ word: pick[pos].word, bucket: pick[pos].bucket }); }
      else { out.unshift(null); anyUnknown = true; }
      pos = p;
    }
    return { parts: out, anyUnknown: anyUnknown, complete: !anyUnknown };
  }

  function respell(phones) {
    var rules = T.respell, i = 0, out = "";
    while (i < phones.length) {
      var hit = null;
      for (var r = 0; r < rules.length; r++) {
        var seq = rules[r][0];
        if (i + seq.length <= phones.length) {
          var ok = true;
          for (var j = 0; j < seq.length; j++) { if (phones[i + j].p !== seq[j]) { ok = false; break; } }
          if (ok) { hit = rules[r]; break; }
        }
      }
      if (hit) { out += hit[1]; i += hit[0].length; }
      else { out += ipaToLetterGuess(phones[i].p); i += 1; }
    }
    return out;
  }

  function ipaToLetterGuess(p) {
    switch (p) {
      case "AA": return "ah"; case "AE": return "a"; case "AH": return "uh";
      case "AO": return "aw"; case "AW": return "ow"; case "AY": return "i";
      case "B": return "b"; case "CH": return "ch"; case "D": return "d";
      case "DH": return "th"; case "EH": return "e"; case "ER": return "er";
      case "EY": return "ay"; case "F": return "f"; case "G": return "g";
      case "HH": return "h"; case "IH": return "i"; case "IY": return "ee";
      case "JH": return "j"; case "K": return "k"; case "L": return "l";
      case "M": return "m"; case "N": return "n"; case "NG": return "ng";
      case "OW": return "ow"; case "OY": return "oi"; case "P": return "p";
      case "R": return "r"; case "S": return "s"; case "SH": return "sh";
      case "T": return "t"; case "TH": return "th"; case "UH": return "oo";
      case "UW": return "oo"; case "V": return "v"; case "W": return "w";
      case "Y": return "y"; case "Z": return "z"; case "ZH": return "zh";
      case "AX": return "a"; case "AXR": return "er"; default: return "?";
    }
  }

  /* Every Shavian character is supplementary (UTF-16 surrogate pair), so all
     character classes that touch them must use the /u flag. */
  var SH_RE = /[\u{10450}-\u{1047F}]/u;
  var NOT_SH_RE = /[^\u{10450}-\u{1047F}]/u;

  function shavianToEnglish(text, opts) {
    opts = opts || {};
    var rev = reverse();
    var tokens = text.split(/(\s+)/);
    var outWords = [], plain = "", anyGuess = false;
    var PAD_RE = /^[\s.,;:!?'"()\[\]{}\u00b7\u2014\u2013-]+|[\s.,;:!?'"()\[\]{}\u00b7\u2014\u2013-]+$/g;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (/^\s+$/.test(tk)) { plain += tk; continue; }
      if (!tk) { continue; }
      var core = tk.replace(PAD_RE, "");
      if (!core) { plain += tk; continue; }
      var start = tk.indexOf(core);
      var trailing = tk.slice(start + core.length);
      if (SH_RE.test(core) && !NOT_SH_RE.test(core)) {
        var res = decodeWord(core, rev, opts);
        plain += res.text + trailing;
        outWords.push(res);
        if (!res.complete) { anyGuess = true; }
      } else {
        // mixed / not Shavian: keep the readable latin part, lowercased
        var latin = core.replace(new RegExp(SH_RE.source, "gu"), "").toLowerCase();
        plain += latin + trailing;
        outWords.push({ src: tk, text: latin, status: "mixed", complete: true, cands: [] });
      }
    }
    return { english: plain, words: outWords, anyGuess: anyGuess };
  }

  function decodeWord(sw, rev, opts) {
    var alts = shavianToPhoneSets(sw);
    var res = { src: sw, shavian: sw, status: "dict", complete: true, cands: [] };
    if (!alts.length) { res.status = "empty"; res.text = sw; return res; }
    // 1. whole-word match: try every phoneme reading, keep the most frequent one
    var hit = null;
    for (var a = 0; a < alts.length; a++) {
      var cands = rev.get(keyOf(alts[a]));
      if (cands && (!hit || cands[0].bucket > hit.cands[0].bucket)) {
        hit = { phones: alts[a], cands: cands };
      }
    }
    if (hit) {
      res.cands = hit.cands.map(function (c) { return { word: c.word, bucket: c.bucket }; });
      res.text = hit.cands[0].word;
      res.alts = hit.cands.slice(1).map(function (c) { return c.word; });
      res.phones = hit.phones;
      res.ipa = phonesToIPA(hit.phones);
      return res;
    }
    // 2. segment
    var bestPlan = null;
    for (var b = 0; b < alts.length; b++) {
      var plan = segment(alts[b]);
      if (!bestPlan) { bestPlan = { plan: plan, phones: alts[b] }; continue; }
      var sc = scorePlan(plan), bs = scorePlan(bestPlan.plan);
      if (sc > bs) { bestPlan = { plan: plan, phones: alts[b] }; }
    }
    var parts = bestPlan.plan.parts, pieces = [], guess = false;
    for (var p = 0; p < parts.length; p++) {
      if (parts[p]) { pieces.push(parts[p].word); }
      else { pieces.push(respell([bestPlan.phones[p] || bestPlan.phones[bestPlan.phones.length - 1]])); guess = true; }
    }
    res.cands = parts.filter(Boolean);
    res.text = pieces.join(" ");
    res.status = guess ? "guess" : "dict";
    res.complete = bestPlan.plan.complete;
    res.phones = bestPlan.phones;
    res.ipa = phonesToIPA(bestPlan.phones);
    res.segmented = parts.length > 1;
    return res;
  }

  function scorePlan(plan) {
    var s = 0;
    for (var i = 0; i < plan.parts.length; i++) {
      s += plan.parts[i] ? plan.parts[i].bucket * 0.85 - 3 : -8;
    }
    return s;
  }

  /* --------------------------------------------------------------- lookup API */
  function describeWord(word) {
    var r = lookup(word);
    if (!r) { return null; }
    return {
      word: word, ipa: phonesToIPA(r.phones), shavian: phonesToShavian(r.phones, "us"),
      shavianUk: phonesToShavian(r.phones, "uk"), phones: r.phones,
      variants: r.variants.map(function (v) { return { ipa: phonesToIPA(v), shavian: phonesToShavian(v, "us") }; })
    };
  }

  return {
    T: T, D: D,
    decodeEnc: decodeEnc, encodePhones: encodePhones,
    phonesToIPA: phonesToIPA, phonesToShavian: phonesToShavian,
    shavianToPhoneSets: shavianToPhoneSets, keyOf: keyOf,
    lookup: lookup, describeWord: describeWord, lts: lts,
    textToShavian: textToShavian, shavianToEnglish: shavianToEnglish,
    respell: respell, intToWords: intToWords, spellOut: spellOut, isInitialism: isInitialism,
    stats: function () { return { words: lexicon().size, rev: reverse().size }; }
  };
});