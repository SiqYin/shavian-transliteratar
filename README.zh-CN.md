<!-- lang-switch:start -->
<div align="center">
    <p><a href="README.md">English</a> · <b>简体中文</b> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a></p>
</div>
<!-- lang-switch:end -->

<div align="center">
    <h1>𐑖𐑱𐑝𐑾𐑯 萧伯纳字母转写器</h1>
    <p><b>英语文本 ⇄ 萧伯纳字母，完全在浏览器中运行。</b></p>
    <p>无后端、无构建步骤、无需账号。</p>
</div>

---

## 网页应用

**→ [https://siqyin.github.io/shavian-transliteratar/](https://siqyin.github.io/shavian-transliteratar/)**

同一页面可作为离线应用（PWA）安装到电脑和安卓设备。

## 下载

前往 [Releases](https://github.com/SiqYin/shavian-transliteratar/releases) 获取 **Windows 安装包 / 便携版** 与 **安卓 APK**，均为内置完整 CMUdict 词典的离线应用。

## 功能

- 基于 [CMUdict](https://github.com/cmusphinx/cmudict) 0.7b 的 英语 → 萧伯纳字母 转写，支持**美式通用发音**与**英式 RP**（不卷舌）两种模式
- 输出国际音标（IPA），音节重音位置正确
- 萧伯纳字母 → 英语：词频加权的动态规划反向词典
- 词典外单词使用 NRL 式字母—读音规则推测
- 词典外的**首字母缩写词**（`RP`、`ATM`、未知股票代码等）按字母名称逐字母拼读
- 数字、序数词、年份、小数；五个经典萧伯纳字母缩写；专名中点（namer dot）
- 逐词异读切换（`read` 现在时/过去时、`record` 名词/动词等）
- 界面支持 **8 种语言**：英语、简体中文、繁體中文、日本語、Français、Español、Deutsch、Italiano
- 可离线使用的可安装 PWA，无需改动即可部署到 GitHub Pages

## 本地运行

```bash
python -m http.server 8000
# → http://127.0.0.1:8000/
```

无需安装或编译任何东西。

## 语言自动检测

- **网页端**：根据接入 IP 的地理位置判定（`ipwho.is` / `get.geojs.io` / `api.country.is`，依次降级备用）。中国大陆 → 简体中文；中国香港 / 澳门 / 台湾 → 繁體中文；日本 → 日本語；法语国家 → Français；德国 / 奥地利 / 列支敦士登 → Deutsch；西班牙语或葡萄牙语为官方语言的国家 → Español；意大利 / 圣马力诺 / 梵蒂冈 → Italiano。英语国家、未专门覆盖的国家和地区，以及有**两个或以上**候选官方语言的国家（瑞士、比利时、卢森堡、加拿大、喀麦隆等）统一使用英语。
- **已安装应用（电脑 / 安卓）**：优先检测系统界面语言；系统语言不在这 8 种语言内时才按 IP 判定。
- 用户手动选择的语言始终会被记住，并优先于自动检测。

完整映射表见 [`web/lang-detect.js`](web/lang-detect.js)。

## 测试

```bash
node tests/test.js        # 引擎：转写、IPA、英式 RP、回转、缩写词、专名中点
node tests/test_lang.js   # IP 地理与系统语言映射规则
```

## 数据流水线

```bash
python tools/fetch_data.py   # 下载 CMUdict 与维基百科参考文本
python tools/build_data.py   # 生成 web/tables.js 与 web/data.js
```

生成的文件已提交到仓库，使用者无需安装 Python。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `index.html`、`sw.js`、`manifest.webmanifest` | 页面、离线缓存（stale-while-revalidate）、PWA 清单 |
| `web/engine.js` | 纯逻辑：词典查询、字母读音规则、IPA、萧伯纳字母编解码 |
| `web/tables.js`、`web/data.js` | Unicode/音素表与由 CMUdict 压缩生成的词典（自动生成） |
| `web/i18n.js`、`web/lang-detect.js` | 界面翻译与语言自动检测 |
| `web/app.js`、`web/styles.css` | 浏览器界面 |
| `tools/` | Python 数据构建脚本 |
| `data/` | 源词典、词频表、字体 |
| `tests/` | Node 测试 |

## 许可证

代码：[MIT](LICENSE)。随附数据：CMUdict（CMUdict 许可证）与 Noto Sans Shavian（SIL OFL 1.1）—— 详见 [LICENSE](LICENSE)。
