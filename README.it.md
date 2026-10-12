<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <b>Italiano</b></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 Traslitteratore shaviano</h1>
    <p><b>Testo inglese ⇄ alfabeto shaviano, interamente nel tuo browser.</b></p>
    <p>Senza server, senza compilazione, senza account.</p>
</div>

---

## Applicazione web

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

La stessa pagina si installa come app offline (PWA) su desktop e Android.

## Download

Scarica l'**installer Windows / l'eseguibile portabile** e l'**APK Android** dalle [Releases](https://github.com/SiqYin/shavian-transliteratar/releases). Sono app offline con il lessico CMUdict completo integrato.

## Funzionalità

- Inglese → shaviano tramite [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b, nelle modalità **General American** e **RP britannico** (non rotico)
- Output in IPA (alfabeto fonetico internazionale) con accento di sillaba nella posizione corretta
- Shaviano → inglese con un lessico inverso a programmazione dinamica ponderato per frequenza
- Parole assenti dal dizionario gestite con regole lettera-suono in stile NRL
- **Sigle** assenti dal dizionario (`RP`, `ATM`, ticker sconosciuti) sono lette lettera per lettera usando i nomi delle lettere
- Numeri, ordinali, anni e decimali; le cinque abbreviazioni shaviane classiche; punto dei nomi propri
- Varianti di pronuncia parola per parola (`read` presente/passato, `record` nome/verbo, …)
- Interfaccia in **8 lingue**: English, 简体中文, 繁體中文, 日本語, Français, Español, Deutsch, Italiano
- PWA installabile e utilizzabile offline, distribuibile senza modifiche su GitHub Pages

## Esecuzione locale

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

Non c'è nulla da installare o compilare.

## Rilevamento automatico della lingua

- **Pagina web:** decide la geolocalizzazione via IP (`ipwho.is` / `get.geojs.io` / `api.country.is`, usati in cascata come fallback). Cina continentale → 简体中文; Hong Kong / Macao / Taiwan → 繁體中文; Giappone → 日本語; paesi di lingua francese → Français; Germania / Austria / Liechtenstein → Deutsch; paesi con spagnolo o portoghese come lingua ufficiale → Español; Italia / San Marino / Città del Vaticano → Italiano. I paesi anglofoni, le regioni non coperte e i paesi con **due o più** delle lingue candidate come ufficiali (Svizzera, Belgio, Lussemburgo, Canada, Camerun, …) usano l'inglese.
- **App installata (desktop / Android):** si controlla prima la lingua di sistema; l'IP viene consultato solo se non corrisponde a nessuna delle otto lingue offerte.
- La scelta manuale viene sempre ricordata e ha priorità sul rilevamento automatico.

La tabella di corrispondenza completa è in [`web/lang-detect.js`](web/lang-detect.js).

## Test

```bash
node tests/test.js        # motore: traslitterazione, IPA, RP, andata e ritorno, sigle, punto dei nomi
node tests/test_lang.js   # regole di mappatura IP-geolocalizzazione e lingua di sistema
```

## Generazione dei dati

```bash
python tools/fetch_data.py   # scarica CMUdict e i testi di riferimento da Wikipedia
python tools/build_data.py   # genera web/tables.js e web/data.js
```

I file generati sono già nel repository, quindi chi usa l'app non ha bisogno di Python.

## Struttura

| Percorso | Scopo |
| --- | --- |
| `index.html`, `sw.js`, `manifest.webmanifest` | Pagina, cache offline (stale-while-revalidate), manifest PWA |
| `web/engine.js` | Logica pura: consultazione del lessico, regole lettera-suono, IPA, codifica/decodifica shaviana |
| `web/tables.js`, `web/data.js` | Tabelle Unicode/foni e lessico compatto derivato da CMUdict (generati) |
| `web/i18n.js`, `web/lang-detect.js` | Traduzioni dell'interfaccia e rilevamento automatico della lingua |
| `web/app.js`, `web/styles.css` | Interfaccia browser |
| `tools/` | Script Python per la generazione dei dati |
| `data/` | Dizionario sorgente, lista di frequenza, font |
| `tests/` | Test Node |

## Licenza

Codice: [MIT](LICENSE). Dati inclusi: CMUdict (licenza CMUdict) e Noto Sans Shavian (SIL OFL 1.1) — vedi [LICENSE](LICENSE) per i dettagli.
