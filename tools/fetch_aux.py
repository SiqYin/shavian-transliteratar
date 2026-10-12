# -*- coding: utf-8 -*-
"""Download word-frequency list (for reverse Shavian->English spelling ranking) and a Shavian webfont."""
import base64
import gzip
import io
import json
import os
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data")
os.makedirs(DATA, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"}


def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


# ---------- 1. frequency lists (fallback chain) ----------
freq_sources = [
    ("https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt", "en_50k.txt"),
    ("https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt", "en_full.txt"),
    ("https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt", "google10k.txt"),
]
freq_path = os.path.join(DATA, "freq_en.txt")
for url, name in freq_sources:
    try:
        raw = get(url)
        txt = raw.decode("utf-8", "replace")
        n = len(txt.splitlines())
        if n < 1000:
            raise ValueError("too few lines: %d" % n)
        open(freq_path, "w", encoding="utf-8").write(txt)
        print("freq OK  %-16s %d lines (%s)" % (name, n, url))
        break
    except Exception as e:
        print("freq FAIL %-16s %s" % (name, e))

# ---------- 2. Noto Sans Shavian webfont (woff2) ----------
css_req_url = ("https://fonts.googleapis.com/css2?"
               "family=Noto+Sans+Shavian:wght@400;500;700&display=swap")
css = get(css_req_url).decode("utf-8")
url_w2 = None
for line in css.splitlines():
    if "src:" in line and "woff2" in line:
        url_w2 = line.split("url(")[1].split(")")[0].strip()
        break
if not url_w2:
    raise SystemExit("no woff2 url in css:\n" + css[:500])
w2 = get(url_w2)
open(os.path.join(DATA, "noto-sans-shavian.woff2"), "wb").write(w2)
open(os.path.join(DATA, "font.css"), "w", encoding="utf-8").write(css)
print("font  %s  %d bytes  (%s)" % ("noto-sans-shavian.woff2", len(w2), url_w2))
print("b64   %d chars" % len(base64.b64encode(w2)))
print("license: SIL Open Font License 1.1 (Google Fonts / Noto project)")