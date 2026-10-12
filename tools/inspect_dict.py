# -*- coding: utf-8 -*-
"""Inspect the downloaded cmudict + frequency data."""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data")

lines = open(os.path.join(DATA, "cmudict.dict"), encoding="latin-1").read().splitlines()
lines = [l for l in lines if l.strip() and not l.startswith(";;;")]
print("entries:", len(lines))
for l in lines[:5]:
    print("  ", l)

APOS = chr(39)
print("with apostrophe:", sum(1 for l in lines if APOS in l.split(" ")[0]))
print("with variant marker:", sum(1 for l in lines if re.match(r"^\S+\(\d+\)\s", l)))
print("unique words:", len({re.sub(r"\(\d+\)", "", l.split(" ")[0]) for l in lines}))

phones = set()
for l in lines:
    for x in l.split(" ")[1:]:
        phones.add(re.sub(r"\d", "", x))
print("phones (%d): %s" % (len(phones), " ".join(sorted(phones))))

for w in ["don" + APOS + "t", "read", "hello", "world", "shaw", "english", "the", "of"]:
    hits = [l for l in lines if re.sub(r"\(\d+\)", "", l.split(" ")[0]).lower() == w]
    print("%-8s %s" % (w, hits[:3]))

freq_path = os.path.join(DATA, "freq_en.txt")
if os.path.exists(freq_path):
    fl = open(freq_path, encoding="utf-8").read().splitlines()
    print("freq lines:", len(fl), fl[:5])