"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "tables.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "data.js"), "utf8"));
const S = require(path.join(ROOT, "web", "engine.js"));

function dump(w) {
  const lk = S.lookup(w);
  const ipa = S.phonesToIPA(lk.phones);
  console.log(w.padEnd(14), JSON.stringify(lk.phones.map(p => p.p + p.s).join(" ")));
  console.log("   ipa:", JSON.stringify(ipa), "codes:", Array.from(ipa).map(c => c.codePointAt(0).toString(16)).join(" "));
}
["understand", "nation", "computer", "hello", "strengthen", "extra"].forEach(dump);

const freq = fs.readFileSync(path.join(ROOT, "data", "freq_en.txt"), "utf8").split("\n").map((l, i) => [l.split(" ")[0], i]).filter(x => x[0]);
const rank = Object.fromEntries(freq.map(([w, i]) => [w, i]));
["john", "the", "paris", "london", "mary", "sarah", "david", "peter", "george"].forEach(w => console.log("rank", w.padEnd(8), rank[w]));
console.log("common contains john:", S.D.common.split(" ").includes("john"));
console.log("common[0..10]:", S.D.common.split(" ").slice(0, 10).join(" "));