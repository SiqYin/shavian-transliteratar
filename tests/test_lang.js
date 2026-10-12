#!/usr/bin/env node
/* Geo-IP / system-language detection rules. Run: node tests/test_lang.js */
"use strict";
const path = require("path");
const D = require(path.join(__dirname, "..", "web", "lang-detect.js"));

let pass = 0, fail = 0;
const bad = [];
function eq(actual, expected, label) {
  if (actual === expected) { pass++; }
  else { fail++; bad.push(`${label}: expected ${expected}, got ${actual}`); }
}

/* geo-IP rules */
const CASES = [
  ["CN", "zh-Hans"],
  ["HK", "zh-Hant"], ["MO", "zh-Hant"], ["TW", "zh-Hant"],
  ["JP", "ja"],
  ["FR", "fr"], ["MC", "fr"], ["SN", "fr"], ["CI", "fr"], ["CD", "fr"],
  ["TD", "fr"], ["MG", "fr"], ["HT", "fr"], ["RE", "fr"],
  ["DE", "de"], ["AT", "de"], ["LI", "de"],
  ["ES", "es"], ["MX", "es"], ["AR", "es"], ["CO", "es"], ["PE", "es"],
  ["PT", "es"], ["BR", "es"], ["AO", "es"], ["MZ", "es"], ["TL", "es"],
  ["IT", "it"], ["SM", "it"], ["VA", "it"],
  // several offered languages are official -> English
  ["CH", "en"], ["BE", "en"], ["LU", "en"], ["CA", "en"], ["CM", "en"],
  ["GQ", "en"], ["BI", "en"],
  // English-speaking and everything unassigned -> English
  ["US", "en"], ["GB", "en"], ["IE", "en"], ["AU", "en"], ["NZ", "en"],
  ["ZA", "en"], ["IN", "en"], ["KR", "en"], ["RU", "en"], ["NL", "en"],
  ["SE", "en"], ["TR", "en"], ["EG", "en"], ["", "en"], ["ZZ", "en"]
];
CASES.forEach(([cc, want]) => eq(D.countryToLang(cc), want, "country " + cc));

/* system-language rules (installed app path) */
const SYS = [
  ["en", "en"], ["en-US", "en"], ["en-GB", "en"],
  ["zh-CN", "zh-Hans"], ["zh-SG", "zh-Hans"], ["zh-Hans", "zh-Hans"],
  ["zh-TW", "zh-Hant"], ["zh-HK", "zh-Hant"], ["zh-MO", "zh-Hant"], ["zh-Hant", "zh-Hant"],
  ["ja", "ja"], ["ja-JP", "ja"],
  ["fr", "fr"], ["fr-FR", "fr"],
  ["es", "es"], ["es-AR", "es"],
  ["de", "de"], ["de-AT", "de"],
  ["it", "it"], ["it-IT", "it"],
  // Portuguese is NOT one of the eight UI languages -> no system match
  ["pt", null], ["pt-BR", null],
  ["ko", null], ["ru", null], ["ar", null], ["", null]
];
SYS.forEach(([tag, want]) => eq(D.systemToLang(tag), want, "system " + tag));

console.log(`detection checks: ${pass} pass, ${fail} fail`);
if (fail) { bad.forEach(b => console.log("  x " + b)); process.exit(1); }
console.log("ALL PASS");
