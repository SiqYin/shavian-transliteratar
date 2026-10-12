<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <b>Deutsch</b> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 Shaw-Transkribierer</h1>
    <p><b>Englischer Text ⇄ Shaw-Alphabet, vollständig in deinem Browser.</b></p>
    <p>Ohne Backend, ohne Build-Schritt, ohne Konto.</p>
</div>

---

## Web-App

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

Dieselbe Seite lässt sich als Offline-App (PWA) auf dem Desktop und unter Android installieren.

## Downloads

**Windows-Installer / portable exe** und **Android-APK** gibt es unter [Releases](https://github.com/SiqYin/shavian-transliteratar/releases). Beide sind Offline-Apps mit dem vollständigen CMUdict-Lexikon.

## Funktionen

- Englisch → Shaw über [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b, in den Modi **General American** und **britisches RP** (nicht-rhotisch)
- IPA-Ausgabe mit korrekt gesetztem Silbenakzent
- Shaw → Englisch mit einem frequentigkeitsgewichteten Umkehrlexikon auf Basis dynamischer Programmierung
- Wörter außerhalb des Wörterbuchs über NRL-artige Buchstaben-Laut-Regeln
- **Initialwörter** außerhalb des Wörterbuchs (`RP`, `ATM`, unbekannte Börsensymbole) werden über die Buchstabennamen buchstabiert
- Zahlen, Ordnungszahlen, Jahreszahlen und Dezimalzahlen; die fünf klassischen Shaw-Abkürzungen; Namenspunkte für Eigennamen
- Pro Wort zwischen Aussprachevarianten wechseln (`read` Präsens/Präteritum, `record` Substantiv/Verb, …)
- Oberfläche in **8 Sprachen**: English, 简体中文, 繁體中文, 日本語, Français, Español, Deutsch, Italiano
- Offline-fähige, installierbare PWA, unverändert auf GitHub Pages bereitstellbar

## Lokal ausführen

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

Es muss nichts installiert oder kompiliert werden.

## Automatische Spracherkennung

- **Webseite:** Die Geolokalisierung per IP entscheidet (`ipwho.is` / `get.geojs.io` / `api.country.is`, jeweils als Fallback). Chinesisches Festland → 简体中文; Hongkong / Macau / Taiwan → 繁體中文; Japan → 日本語; französischsprachige Länder → Français; Deutschland / Österreich / Liechtenstein → Deutsch; Länder mit Spanisch oder Portugiesisch als Amtssprache → Español; Italien / San Marino / Vatikanstadt → Italiano. Englischsprachige Länder, nicht erfasste Regionen und Länder mit **zwei oder mehr** der infrage kommenden Amtssprachen (Schweiz, Belgien, Luxemburg, Kanada, Kamerun, …) fallen auf Englisch zurück.
- **Installierte App (Desktop / Android):** Zuerst wird die Systemsprache geprüft; die IP wird nur befragt, wenn keine der acht angebotenen Sprachen erkannt wird.
- Eine manuelle Sprachwahl wird immer gespeichert und überschreibt die automatische Erkennung.

Die vollständige Zuordnung steht in [`web/lang-detect.js`](web/lang-detect.js).

## Tests

```bash
node tests/test.js        # Engine: Transkription, IPA, RP, Rückübersetzung, Initialwörter, Namenspunkt
node tests/test_lang.js   # Regeln für IP-Geolokalisierung und Systemsprache
```

## Daten-Erzeugung

```bash
python tools/fetch_data.py   # CMUdict und Wikipedia-Referenztexte herunterladen
python tools/build_data.py   # web/tables.js und web/data.js erzeugen
```

Die erzeugten Dateien sind im Repository enthalten, Python ist für die Nutzung also nicht nötig.

## Struktur

| Pfad | Zweck |
| --- | --- |
| `index.html`, `sw.js`, `manifest.webmanifest` | Seite, Offline-Cache (stale-while-revalidate), PWA-Manifest |
| `web/engine.js` | Reine Logik: Lexikon, Buchstaben-Laut-Regeln, IPA, Shaw-Kodierung/-Dekodierung |
| `web/tables.js`, `web/data.js` | Unicode-/Lauttabellen und kompaktes, aus CMUdict abgeleitetes Lexikon (generiert) |
| `web/i18n.js`, `web/lang-detect.js` | Übersetzungen und automatische Spracherkennung |
| `web/app.js`, `web/styles.css` | Browser-Oberfläche |
| `tools/` | Python-Skripte zur Datenerzeugung |
| `data/` | Quellwörterbuch, Häufigkeitsliste, Schriftart |
| `tests/` | Node-Tests |

## Lizenz

Code: [MIT](LICENSE). Mitgelieferte Daten: CMUdict (CMUdict-Lizenz) und Noto Sans Shavian (SIL OFL 1.1) — Einzelheiten in [LICENSE](LICENSE).
