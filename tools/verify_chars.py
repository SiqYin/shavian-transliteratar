# -*- coding: utf-8 -*-
"""Verify every Shavian character against the official Unicode character name."""
import os
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shavian_tables import LETTERS, LIGATURES  # noqa: E402

ok = True
seen = {}
for ch, name, ipa, kind, arp, alts, ex in LETTERS + LIGATURES:
    try:
        uname = unicodedata.name(ch)
    except ValueError:
        uname = "<UNKNOWN>"
    expect = "SHAVIAN " + ("SIGN " if uname.startswith("SHAVIAN SIGN") else "LETTER ")
    good = uname.startswith("SHAVIAN") and uname.endswith(name.upper())
    ok &= good
    seen[ch] = (uname, name, arp)
    print("U+%05X %s  %-46s table=%-8s %s" % (ord(ch), ch, uname, name, "OK" if good else "<<< MISMATCH"))

print()
print("distinct chars:", len(seen))
dupes = [v for v in seen.values()]
print("all names match table:", ok)