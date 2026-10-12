# -*- coding: utf-8 -*-
"""Build web/data.js + web/tables.js from cmudict + the frequency list.

Output encoding (compact, ASCII only):
  phone index -> PH_CHARS[i];  '+' = primary stress, '/' = secondary stress
  forward lexicon : "word enc" per line
  variant lexicon : "word enc" per line (extra pronunciations only)
  reverse lexicon : "keyenc cand1,cand2,cand3" per line, sorted by key
"""
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
WEB = os.path.join(ROOT, "web")
os.makedirs(WEB, exist_ok=True)

sys.path.insert(0, HERE)
from shavian_tables import (LETTERS, LIGATURES, PHONES, VOWELS, SYLLABIC_OK,  # noqa: E402
                            IPA_US, IPA_LONG, IPA_REDUCED, build_phone_to_shavian,
                            build_shavian_to_arpabet, SHAVIAN_ABBREV, NAMER_DOT, RESPELL)

PH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
PH_IDX = {p: PH_CHARS[i] for i, p in enumerate(PHONES)}
STR1, STR2 = "+", "/"
TAGS = {"#", "abbrev", "danish", "dutch", "finnish", "foreign", "french", "german",
        "irish", "italian", "japanese", "korean", "name", "name:", "old", "org",
        "place", "russian", "spanish", "title", "vietnamese", "polish", "portuguese"}

WORD_OK = re.compile(r"^[a-z'\-\.]+$")


def encode(phones):
    """[phone] or [(phone, stress)] -> compact string"""
    out = []
    for item in phones:
        if isinstance(item, tuple):
            p, s = item
        else:
            p, s = item, 0
        if s == 1:
            out.append(STR1)
        elif s == 2:
            out.append(STR2)
        out.append(PH_IDX[p])
    return "".join(out)


def strip_stress(phones):
    return [p for p, _ in phones]


# ---------------------------------------------------------------- read inputs
freq = {}
with open(os.path.join(DATA, "freq_en.txt"), encoding="utf-8") as f:
    for line in f:
        parts = line.split()
        if len(parts) == 2:
            w = parts[0].lower()
            try:
                c = int(parts[1])
            except ValueError:
                continue
            if w not in freq:
                freq[w] = c

pron = {}        # word -> [ [(phone, stress), ...] , ... ]   (order = cmudict order)
pron_tags = {}   # word -> set(tags)
with open(os.path.join(DATA, "cmudict.dict"), encoding="latin-1") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith(";;;"):
            continue
        parts = line.split(" ")
        raw_word = parts[0]
        word = re.sub(r"\(\d+\)$", "", raw_word).lower()
        if not WORD_OK.match(word):
            continue
        seq, found_tag = [], False
        for tok in parts[1:]:
            m = re.match(r"^([A-Z]+)([0-2])?$", tok)
            if m and m.group(1) in PH_IDX:
                seq.append((m.group(1), int(m.group(2) or 0)))
            else:
                found_tag = True
                pron_tags.setdefault(word, set()).add(tok.lower())
        if not seq:
            continue
        lst = pron.setdefault(word, [])
        if seq not in lst:
            lst.append(seq)

print("lexicon words: %d   pronunciations: %d" % (len(pron), sum(len(v) for v in pron.values())))
print("multi-pronunciation words: %d" % sum(1 for v in pron.values() if len(v) > 1))

# ------------------------------------------------------------- forward lexicon
fwd, var = [], []
for w in sorted(pron):
    lst = pron[w]
    fwd.append("%s %s" % (w, encode(lst[0])))
    for extra in lst[1:]:
        var.append("%s %s" % (w, encode(extra)))

# ------------------------------------------------------------- reverse lexicon
cands = {}     # stressless key -> {word: (score_tuple, primary_flag)}
for w, lst in pron.items():
    fw = freq.get(w, 0)
    for i, seq in enumerate(lst):
        key = encode(strip_stress(seq))
        cur = cands.setdefault(key, {})
        # rank: frequency desc, primary pron first, shorter word, alphabetical
        score = (fw, 1 if i == 0 else 0, -len(w))
        if w not in cur or score > cur[w][0]:
            cur[w] = (score, i == 0)
MAXCAND = 4
B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
# frequency bucket: log-scaled, 1 base36 char per candidate so the reverse DP
# can still prefer the common spelling of a homophone
def bucket(f):
    if not f:
        return 0
    v = int(round((__import__("math").log10(f + 1)) * 3))
    return min(35, v)

rev_lines = []
for key in sorted(cands):
    items = sorted(cands[key].items(), key=lambda kv: (-kv[1][0][0], -kv[1][0][1], -kv[1][0][2], kv[0]))
    words = ["%s%s" % (w, B36[bucket(freq.get(w, 0))]) for w, _ in items[:MAXCAND]]
    rev_lines.append("%s %s" % (key, ",".join(words)))

print("reverse keys: %d" % len(rev_lines))

# -------------------------------------------------- proper-noun hint (namer dot)
PROPER_TAGS = {"name", "name:", "place", "org", "title"}
proper_words = sorted(w for w, tags in pron_tags.items() if tags & PROPER_TAGS and w.isalpha())
print("proper-noun hints: %d" % len(proper_words))

# ------------------------------------------------------ frequent-word helper
# used at runtime to tell "The dog" (capitalised sentence start) from "John"
common_words = [w for w, _ in sorted(freq.items(), key=lambda kv: -kv[1])][:3000]
print("common-word list: %d" % len(common_words))

# ------------------------------------------------------------------ tables.js
ph2sh_us = build_phone_to_shavian("us")
ph2sh_uk = build_phone_to_shavian("uk")
sh2ph = build_shavian_to_arpabet()

letters_json = []
for ch, name, ipa, kind, arp, alts, ex in LETTERS:
    letters_json.append({"c": ch, "n": name, "ipa": ipa, "k": kind, "arp": arp, "ex": ex})
for ch, name, ipa, kind, arp, alts, ex in LIGATURES:
    letters_json.append({"c": ch, "n": name, "ipa": ipa, "k": kind, "arp": arp, "ex": ex})

tables = {
    "letters": letters_json,
    "ph2sh_us": ph2sh_us,
    "ph2sh_uk": ph2sh_uk,
    "sh2ph": sh2ph,
    "phones": PHONES,
    "vowels": sorted(VOWELS),
    "syllabic": sorted(SYLLABIC_OK),
    "ipa": IPA_US,
    "ipaLong": sorted(IPA_LONG),
    "ipaReduced": IPA_REDUCED,
    "abbrev": SHAVIAN_ABBREV,
    "respell": [[list(seq), txt] for seq, txt in RESPELL],
    "namerDot": NAMER_DOT,
}
with open(os.path.join(WEB, "tables.js"), "w", encoding="utf-8") as f:
    f.write("// generated by tools/build_data.py - do not edit\n")
    f.write("window.SHAVIAN_TABLES = ")
    json.dump(tables, f, ensure_ascii=False, sort_keys=True)
    f.write(";\n")

# ------------------------------------------------------------------- data.js
def js_string(s):
    return json.dumps(s, ensure_ascii=False)

with open(os.path.join(WEB, "data.js"), "w", encoding="utf-8") as f:
    f.write("// generated by tools/build_data.py - do not edit\n")
    f.write("window.SHAVIAN_DATA = {\n")
    f.write("  phChars: %s,\n" % js_string(PH_CHARS))
    f.write("  words: %s,\n" % js_string("\n".join(fwd)))
    f.write("  variants: %s,\n" % js_string("\n".join(var)))
    f.write("  reverse: %s,\n" % js_string("\n".join(rev_lines)))
    f.write("  proper: %s,\n" % js_string(" ".join(proper_words)))
    f.write("  common: %s\n" % js_string(" ".join(common_words)))
    f.write("};\n")

for name in ("tables.js", "data.js"):
    p = os.path.join(WEB, name)
    print("%-10s %8.1f KB" % (name, os.path.getsize(p) / 1024))