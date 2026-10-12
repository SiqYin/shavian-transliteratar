# -*- coding: utf-8 -*-
"""Enumerate the Shavian Unicode block and print official names -> correct codepoints."""
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
for cp in range(0x10450, 0x10520):
    ch = chr(cp)
    try:
        nm = unicodedata.name(ch)
    except ValueError:
        continue
    if nm.startswith("SHAVIAN"):
        print("U+%05X  %s  %s" % (cp, ch, nm))