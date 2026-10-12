<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <b>Español</b> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 Transliterador shaviano</h1>
    <p><b>Texto en inglés ⇄ alfabeto shaviano, funcionando íntegramente en tu navegador.</b></p>
    <p>Sin servidor, sin compilación, sin cuenta.</p>
</div>

---

## Aplicación web

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

La misma página se instala como aplicación sin conexión (PWA) en ordenador y Android.

## Funciones

- Inglés → shaviano mediante [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b, en modos **General American** y **RP británico** (no rótico)
- Salida en IPA (alfabeto fonético internacional) con el acento de sílaba bien colocado
- Shaviano → inglés con un léxico inverso de programación dinámica ponderado por frecuencia
- Palabras que no están en el diccionario resueltas con reglas letra-sonido de estilo NRL
- **Siglas** que no están en el diccionario (`RP`, `ATM`, símbolos bursátiles desconocidos) se leen letra por letra con su nombre
- Números, ordinales, años y decimales; las cinco abreviaturas shavianas clásicas; punto de nombres propios
- Variantes de pronunciación por palabra (`read` presente/pasado, `record` nombre/verbo, …)
- Interfaz en **8 idiomas**: English, 简体中文, 繁體中文, 日本語, Français, Español, Deutsch, Italiano
- PWA instalable y sin conexión, desplegable tal cual en GitHub Pages

## Ejecutar localmente

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

No hay que instalar ni compilar nada.

## Detección automática del idioma

- **Página web:** decide la geolocalización por IP (`ipwho.is` / `get.geojs.io` / `api.country.is`, como respaldos sucesivos). China continental → 简体中文; Hong Kong / Macao / Taiwán → 繁體中文; Japón → 日本語; países de habla francesa → Français; Alemania / Austria / Liechtenstein → Deutsch; países con español o portugués como idioma oficial → Español; Italia / San Marino / Ciudad del Vaticano → Italiano. Los países de habla inglesa, las regiones no contempladas y los países con **dos o más** de los idiomas candidatos como oficiales (Suiza, Bélgica, Luxemburgo, Canadá, Camerún, …) usan inglés.
- **Aplicación instalada (ordenador / Android):** primero se comprueba el idioma del sistema; solo se consulta la IP cuando no coincide con ninguno de los ocho idiomas ofrecidos.
- La elección manual siempre se recuerda y prevalece sobre la detección.

La tabla de correspondencia completa está en [`web/lang-detect.js`](web/lang-detect.js).

## Pruebas

```bash
node tests/test.js        # motor: transliteración, IPA, RP, ida y vuelta, siglas, punto de nombres
node tests/test_lang.js   # reglas de asignación por IP geográfica e idioma del sistema
```

## Generación de datos

```bash
python tools/fetch_data.py   # descarga CMUdict + textos de referencia de Wikipedia
python tools/build_data.py   # genera web/tables.js y web/data.js
```

Los archivos generados ya están en el repositorio, así que quienes usan la aplicación no necesitan Python.

## Estructura

| Ruta | Función |
| --- | --- |
| `index.html`, `sw.js`, `manifest.webmanifest` | Página, caché sin conexión (stale-while-revalidate), manifiesto PWA |
| `web/engine.js` | Lógica pura: léxico, reglas letra-sonido, IPA, codificación/decodificación shaviana |
| `web/tables.js`, `web/data.js` | Tablas Unicode/fonemas y léxico compacto derivado de CMUdict (generados) |
| `web/i18n.js`, `web/lang-detect.js` | Traducciones de la interfaz y detección automática |
| `web/app.js`, `web/styles.css` | Interfaz del navegador |
| `tools/` | Scripts Python de generación de datos |
| `data/` | Diccionario fuente, lista de frecuencia, tipografía |
| `tests/` | Pruebas Node |

## Licencia

Código: [MIT](LICENSE). Datos incluidos: CMUdict (licencia CMUdict) y Noto Sans Shavian (SIL OFL 1.1) — consulta [LICENSE](LICENSE) para más detalles.
