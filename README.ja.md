<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.zh-TW.md">繁體中文</a> · <b>日本語</b> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 ショー文字変換ツール</h1>
    <p><b>英語テキスト ⇄ ショー文字、すべてブラウザ内で動作します。</b></p>
    <p>バックエンドなし、ビルド不要、アカウント不要。</p>
</div>

---

## ウェブアプリ

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

同じページをオフラインアプリ（PWA）として PC や Android にインストールできます。

## 機能

- [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b による 英語 → ショー文字変換。**米国 General American** と**英国 RP**（非 R 音化）の 2 モード
- 音節強勢の位置が正しい IPA 出力
- 頻度重み付き動的計画法の逆引き辞書による ショー文字 → 英語
- 辞書にない単語は NRL 式の文字—音素ルールで推定
- 辞書にない**頭字語**（`RP`、`ATM`、未知のティッカーなど）は文字名を 1 文字ずつ読み上げ
- 数字・序数・西暦・小数、古典的な 5 つのショー文字略語、固有名詞のネーマードット
- 単語ごとの異発音切替（`read` の現在形／過去形、`record` の名詞／動詞など）
- 表示言語 **8 言語**：English、简体中文、繁體中文、日本語、Français、Español、Deutsch、Italiano
- オフライン対応のインストール可能な PWA。そのまま GitHub Pages にデプロイ可能

## ローカルでの実行

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

インストールもコンパイルも不要です。

## 言語の自動判定

- **ウェブページ**：接続 IP の地理位置で判定します（`ipwho.is` / `get.geojs.io` / `api.country.is` を順にフォールバック）。中国大陸 → 简体中文、香港／マカオ／台湾 → 繁體中文、日本 → 日本語、フランス語圏 → Français、ドイツ／オーストリア／リヒテンシュタイン → Deutsch、スペイン語またはポルトガル語が公用語の国 → Español、イタリア／サンマリノ／バチカン → Italiano。英語圏、対象外の国・地域、および候補言語のうち**2 つ以上**が公用語の国（スイス、ベルギー、ルクセンブルク、カナダ、カメルーンなど）は英語になります。
- **インストール版（PC／Android）**：まずシステムの表示言語を確認し、8 言語のいずれでもない場合のみ IP で判定します。
- 手動で選択した言語は常に保存され、自動判定より優先されます。

対応表の全体は [`web/lang-detect.js`](web/lang-detect.js) をご覧ください。

## テスト

```bash
node tests/test.js        # エンジン：変換、IPA、RP、往復変換、頭字語、ネーマードット
node tests/test_lang.js   # IP 地理とシステム言語の対応ルール
```

## データ生成

```bash
python tools/fetch_data.py   # CMUdict とウィキペディアの参照テキストを取得
python tools/build_data.py   # web/tables.js と web/data.js を生成
```

生成ファイルはコミット済みなので、利用者が Python を用意する必要はありません。

## ディレクトリ構成

| パス | 役割 |
| --- | --- |
| `index.html`、`sw.js`、`manifest.webmanifest` | ページ、オフラインキャッシュ（stale-while-revalidate）、PWA マニフェスト |
| `web/engine.js` | 純粋ロジック：辞書引き、文字—音素ルール、IPA、ショー文字の符号化／復号 |
| `web/tables.js`、`web/data.js` | Unicode／音素テーブルと CMUdict から生成したコンパクト辞書（生成ファイル） |
| `web/i18n.js`、`web/lang-detect.js` | UI 翻訳と言語自動判定 |
| `web/app.js`、`web/styles.css` | ブラウザ UI |
| `tools/` | Python のデータ生成スクリプト |
| `data/` | 元辞書、頻度リスト、フォント |
| `tests/` | Node テスト |

## ライセンス

コード：[MIT](LICENSE)。同梱データ：CMUdict（CMUdict ライセンス）および Noto Sans Shavian（SIL OFL 1.1）—— 詳細は [LICENSE](LICENSE) をご覧ください。
