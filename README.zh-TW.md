<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <b>繁體中文</b> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 蕭伯納字母轉寫器</h1>
    <p><b>英語文本 ⇄ 蕭伯納字母，完全在瀏覽器中執行。</b></p>
    <p>無後端、無建置步驟、無需帳號。</p>
</div>

---

## 網頁應用

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

同一頁面可作為離線應用（PWA）安裝到電腦與安卓裝置。

## 下載

前往 [Releases](https://github.com/SiqYin/shavian-transliteratar/releases) 取得 **Windows 安裝檔 / 攜帶版** 與 **安卓 APK**，均為內建完整 CMUdict 詞典的離線應用。

## 功能

- 基於 [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b 的 英語 → 蕭伯納字母 轉寫，支援**美式通用發音**與**英式 RP**（不捲舌）兩種模式
- 輸出國際音標（IPA），音節重音位置正確
- 蕭伯納字母 → 英語：詞頻加權的動態規劃反向詞典
- 詞典外單字使用 NRL 式字母—讀音規則推測
- 詞典外的**首字母縮寫詞**（`RP`、`ATM`、未知股票代號等）按字母名稱逐字母拼讀
- 數字、序數詞、年份、小數；五個經典蕭伯納字母縮寫；專名中點（namer dot）
- 逐詞異讀切換（`read` 現在式／過去式、`record` 名詞／動詞等）
- 介面支援 **8 種語言**：English、简体中文、繁體中文、日本語、Français、Español、Deutsch、Italiano
- 可離線使用的可安裝 PWA，無需改動即可部署到 GitHub Pages

## 本機執行

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

無需安裝或編譯任何東西。

## 語言自動偵測

- **網頁端**：依據連線 IP 的地理位置判定（`ipwho.is` / `get.geojs.io` / `api.country.is`，依次降級備用）。中國大陸 → 简体中文；中國香港／澳門／臺灣 → 繁體中文；日本 → 日本語；法語國家 → Français；德國／奧地利／列支敦士登 → Deutsch；西班牙語或葡萄牙語為官方語言的國家 → Español；義大利／聖馬利諾／梵蒂岡 → Italiano。英語國家、未特別涵蓋的國家與地區，以及有**兩個以上**候選官方語言的國家（瑞士、比利時、盧森堡、加拿大、喀麥隆等）統一使用英語。
- **已安裝應用（電腦／安卓）**：優先偵測系統介面語言；系統語言不在這 8 種語言內時才依 IP 判定。
- 使用者手動選擇的語言一律記住，並優先於自動偵測。

完整對照表見 [`web/lang-detect.js`](web/lang-detect.js)。

## 測試

```bash
node tests/test.js        # 引擎：轉寫、IPA、英式 RP、回轉、縮寫詞、專名中點
node tests/test_lang.js   # IP 地理與系統語言對應規則
```

## 資料管線

```bash
python tools/fetch_data.py   # 下載 CMUdict 與維基百科參考文本
python tools/build_data.py   # 產生 web/tables.js 與 web/data.js
```

產生的檔案已提交到儲存庫，使用者無需安裝 Python。

## 目錄結構

| 路徑 | 用途 |
| --- | --- |
| `index.html`、`sw.js`、`manifest.webmanifest` | 頁面、離線快取（stale-while-revalidate）、PWA 清單 |
| `web/engine.js` | 純邏輯：詞典查詢、字母讀音規則、IPA、蕭伯納字母編解碼 |
| `web/tables.js`、`web/data.js` | Unicode／音素表與由 CMUdict 壓縮產生的詞典（自動產生） |
| `web/i18n.js`、`web/lang-detect.js` | 介面翻譯與語言自動偵測 |
| `web/app.js`、`web/styles.css` | 瀏覽器介面 |
| `tools/` | Python 資料建置指令碼 |
| `data/` | 源詞典、詞頻表、字型 |
| `tests/` | Node 測試 |

## 授權

程式碼：[MIT](LICENSE)。隨附資料：CMUdict（CMUdict 授權）與 Noto Sans Shavian（SIL OFL 1.1）—— 詳見 [LICENSE](LICENSE)。
