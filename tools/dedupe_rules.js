#!/usr/bin/env node
/* Dedupe the LTS_RULES array in web/engine.js (keeps first occurrence). */
"use strict";
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "web", "engine.js");
const src = fs.readFileSync(file, "utf8");
const start = src.indexOf("var LTS_RULES = [");
const end = src.indexOf("\n  ];", start);
if (start < 0 || end < 0) { throw new Error("LTS_RULES block not found"); }
const body = src.slice(start + "var LTS_RULES = [".length, end);
const lines = body.split("\n");
const seen = new Set();
const kept = [];
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith("//")) { continue; }
  if (seen.has(t)) { continue; }
  seen.add(t);
  kept.push("    " + t);
}
const out = src.slice(0, start) + "var LTS_RULES = [\n" + kept.join("\n") + "\n  ];" + src.slice(end + "\n  ];".length);
fs.writeFileSync(file, out, "utf8");
console.log("LTS rules: %d -> %d unique", lines.filter(l => l.trim()).length, kept.length);