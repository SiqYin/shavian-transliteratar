<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <b>Français</b> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 Translittérateur shavien</h1>
    <p><b>Texte anglais ⇄ alphabet shavien, entièrement dans votre navigateur.</b></p>
    <p>Sans serveur, sans étape de compilation, sans compte.</p>
</div>

---

## Application web

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

La même page s'installe comme application hors ligne (PWA) sur ordinateur et Android.

## Téléchargements

Récupérez l'**installateur Windows / l'exécutable portable** et l'**APK Android** depuis les [Releases](https://github.com/SiqYin/shavian-transliteratar/releases). Ce sont des applications hors ligne avec le lexique CMUdict intégral.

## Fonctionnalités

- Anglais → shavien via [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b, en modes **General American** et **RP britannique** (non rhotique)
- Sortie API (alphabet phonétique international) avec placement correct de l'accent de syllabe
- Shavien → anglais grâce à un lexique inverse par programmation dynamique pondéré par la fréquence
- Mots absents du dictionnaire traités par des règles lettre-son de type NRL
- **Sigles** absents du dictionnaire (`RP`, `ATM`, tickers inconnus) épelés avec les noms des lettres
- Nombres, ordinaux, années et décimales ; les cinq abréviations shaviennes classiques ; point des noms propres
- Variantes de prononciation par mot (`read` présent/passé, `record` nom/verbe, …)
- Interface en **8 langues** : English, 简体中文, 繁體中文, 日本語, Français, Español, Deutsch, Italiano
- PWA installable et hors ligne, déployable telle quelle sur GitHub Pages

## Exécuter localement

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

Rien à installer ni à compiler.

## Détection automatique de la langue

- **Page web :** la géolocalisation par IP décide (`ipwho.is` / `get.geojs.io` / `api.country.is`, en secours successifs). Chine continentale → 简体中文 ; Hong Kong / Macao / Taïwan → 繁體中文 ; Japon → 日本語 ; pays francophones → Français ; Allemagne / Autriche / Liechtenstein → Deutsch ; pays dont l'espagnol ou le portugais est langue officielle → Español ; Italie / Saint-Marin / Vatican → Italiano. Les pays anglophones, les régions non couvertes et les pays ayant **deux ou plus** des langues candidates comme langues officielles (Suisse, Belgique, Luxembourg, Canada, Cameroun, …) basculent en anglais.
- **Application installée (ordinateur / Android) :** la langue du système est vérifiée d'abord ; l'IP n'est consultée que si elle n'appartient pas aux huit langues proposées.
- Un choix manuel est toujours mémorisé et l'emporte sur la détection.

La table de correspondance détaillée figure dans [`web/lang-detect.js`](web/lang-detect.js).

## Tests

```bash
node tests/test.js        # moteur : translittération, API, RP, aller-retour, sigles, point des noms
node tests/test_lang.js   # règles de correspondance IP-géo et langue système
```

## Chaîne de données

```bash
python tools/fetch_data.py   # télécharge CMUdict + les textes de référence Wikipédia
python tools/build_data.py   # génère web/tables.js et web/data.js
```

Les fichiers générés sont déjà dans le dépôt : Python n'est pas nécessaire pour utiliser l'application.

## Structure

| Chemin | Rôle |
| --- | --- |
| `index.html`, `sw.js`, `manifest.webmanifest` | Page, cache hors ligne (stale-while-revalidate), manifeste PWA |
| `web/engine.js` | Logique pure : lexique, règles lettre-son, API, codage/décodage shavien |
| `web/tables.js`, `web/data.js` | Tables Unicode/phonèmes et lexique compact issu de CMUdict (générés) |
| `web/i18n.js`, `web/lang-detect.js` | Traductions de l'interface et détection automatique |
| `web/app.js`, `web/styles.css` | Interface du navigateur |
| `tools/` | Scripts Python de génération des données |
| `data/` | Dictionnaire source, liste de fréquence, police |
| `tests/` | Suites de tests Node |

## Licence

Code : [MIT](LICENSE). Données incluses : CMUdict (licence CMUdict) et Noto Sans Shavian (SIL OFL 1.1) — voir [LICENSE](LICENSE) pour le détail.
