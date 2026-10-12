# -*- coding: utf-8 -*-
"""Download source data: Wikipedia Shavian letter tables + CMU pronouncing dictionary."""
import json
import os
import urllib.request
import urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data")
os.makedirs(DATA, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (shavian-converter build script)"}


def get(url, dest=None):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        raw = r.read()
    if dest:
        with open(dest, "wb") as f:
            f.write(raw)
        print("saved %-28s %9d bytes" % (os.path.basename(dest), len(raw)))
    return raw


# 1. Wikipedia wikitext (English + Chinese) for the letter tables
for lang, title in (("en", "Shavian_alphabet"), ("zh", "蕭伯納字母")):
    q = urllib.parse.urlencode({
        "action": "query", "prop": "revisions", "rvprop": "content",
        "rvslots": "main", "format": "json", "formatversion": "2",
        "redirects": "1", "titles": title,
    })
    url = "https://%s.wikipedia.org/w/api.php?%s" % (lang, q)
    raw = get(url, os.path.join(DATA, "wiki_%s.json" % lang))
    txt = json.loads(raw.decode("utf-8"))
    page = txt["query"]["pages"][0]
    if "revisions" not in page:
        print("  !! zh lookup failed: %s" % json.dumps(txt)[:300])
        continue
    content = page["revisions"][0]["slots"]["main"]["content"]
    with open(os.path.join(DATA, "wiki_%s.txt" % lang), "w", encoding="utf-8") as f:
        f.write(content)
    print("  wikitext %s: %d chars" % (lang, len(content)))

# 2. CMU pronouncing dictionary
get("https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict",
    os.path.join(DATA, "cmudict.dict"))

print("done")