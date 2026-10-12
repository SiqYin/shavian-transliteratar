<!-- lang-switch:start -->
<div align="center">
    <p><b>English</b> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 Shavian Transliteratar</h1>
    <p><b>English text ⇄ Shavian alphabet, running entirely in your browser.</b></p>
    <p>No backend, no build step, no account.</p>
</div>

---

## Web app

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

The same page installs as an offline app (PWA) on desktop and Android.

## Features

- English → Shavian via [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b, in **General American** and **British RP** (non-rhotic) modes
- IPA output with correct syllable-stress placement
- Shavian → English with a frequency-weighted dynamic-programming reverse lexicon
- Out-of-dictionary words handled by NRL-style letter-to-sound rules
- Out-of-dictionary **initialisms** (`RP`, `ATM`, unknown ticker symbols) are spelled out as letter names
- Numbers, ordinals, years and decimals; the five classic Shavian abbreviations; proper-noun namer dots
- Per-word pronunciation variants (`read` present/past, `record` noun/verb, …)
- Interface in **8 languages**: English, 简体中文, 繁體中文, 日本語, Français, Español, Deutsch, Italiano
- Offline-capable installable PWA, deployable unchanged on GitHub Pages

## Run locally

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

There is nothing to install or compile.

## Automatic language detection

- **Web page:** geo-IP decides (`ipwho.is` / `get.geojs.io` / `api.country.is`, each only as a fallback). Mainland China → 简体中文; Hong Kong / Macau / Taiwan → 繁體中文; Japan → 日本語; French-speaking countries → Français; Germany / Austria / Liechtenstein → Deutsch; countries where Spanish or Portuguese is an official language → Español; Italy / San Marino / Vatican City → Italiano. English-speaking countries, unassigned regions, and countries with **two or more** of the candidate official languages (Switzerland, Belgium, Luxembourg, Canada, Cameroon, …) fall back to English.
- **Installed app (desktop / Android):** the system UI language is checked first; geo-IP is consulted only when it is not one of the eight offered languages.
- A manual language choice is always remembered and overrides detection.

See [`web/lang-detect.js`](web/lang-detect.js) for the exact mapping.

## Tests

```bash
node tests/test.js        # engine: transliteration, IPA, RP, round trip, initialisms, namer dots
node tests/test_lang.js   # geo-IP and system-language mapping rules
```

## Data pipeline

```bash
python tools/fetch_data.py   # download CMUdict + Wikipedia reference wikitext
python tools/build_data.py   # generate web/tables.js + web/data.js
```

The generated files are committed, so end users never need Python.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html`, `sw.js`, `manifest.webmanifest` | Page, offline cache (stale-while-revalidate), PWA manifest |
| `web/engine.js` | Pure logic: lexicon lookup, letter-to-sound, IPA, Shavian encode/decode |
| `web/tables.js`, `web/data.js` | Unicode/phone tables and the compact CMUdict-derived lexicon (generated) |
| `web/i18n.js`, `web/lang-detect.js` | UI translations and automatic language detection |
| `web/app.js`, `web/styles.css` | Browser UI |
| `tools/` | Python data build scripts |
| `data/` | Source dictionary, frequency list, font |
| `tests/` | Node test suites |

## License

Code: [MIT](LICENSE). Bundled data: CMUdict (CMUdict license) and Noto Sans Shavian (SIL OFL 1.1) — see [LICENSE](LICENSE) for details.
