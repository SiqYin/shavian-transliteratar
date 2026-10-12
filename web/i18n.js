/* Tiny i18n for the Shavian Transliteratar: eight UI locales, English fallback.
 * Browser + Node. Static nodes opt in with data-i18n / data-i18n-ph /
 * data-i18n-title; dynamic strings use I18N.t("key", {x: 1}). */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module !== null && typeof module.exports !== "undefined") {
    module.exports = api;
  }
  if (root) { root.I18N = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EN = "en";
  var STORAGE_KEY = "shavian-lang";
  var listeners = [];

  // Native endonyms for the selector
  var LANG_NAMES = {
    en: "English",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文",
    ja: "日本語",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano"
  };
  var ORDER = ["en", "zh-Hans", "zh-Hant", "ja", "fr", "es", "de", "it"];

  var MESSAGES = {
    en: {
      title: "Shavian Transliteratar",
      tagline: "English \u21c4 Shavian alphabet \u00b7 CMUdict-powered, with General American / RP pronunciations, IPA and bidirectional conversion",
      dirFwd: "English \u2192 Shavian",
      dirRev: "Shavian \u2192 English",
      accent: "Accent",
      modeUs: "General American (rhotic)",
      modeUk: "British RP (non-rhotic)",
      optAbbrev: "Abbreviations (the/to/of/and/for)",
      optNamer: "Namer dot for proper nouns",
      optNameStart: "Treat sentence-initial capitals as names",
      inEn: "English input",
      inSh: "Shavian input",
      outSh: "Shavian",
      outEn: "English",
      sample: "Sample",
      clear: "Clear",
      copy: "Copy result",
      copied: "Copied",
      langLabel: "Language",
      warnOov: "Not in CMUdict \u2014 guessed with letter-to-sound rules: ",
      warnSeg: "No whole-word match \u2014 segmented / respelled: ",
      chartTitle: "Alphabet (Unicode U+10450\u2013U+1047F)",
      gTall: "Tall letters (voiceless consonants)",
      gDeep: "Deep letters (voiced consonants)",
      gShort: "Short letters (vowels, liquids, nasals)",
      gLig: "Ligatures (rhotic vowels and more)",
      stats: "Lexicon: {words} entries \u00b7 {rev} reverse keys",
      footerData: "Data: CMU Pronouncing Dictionary 0.7b \u00b7 Font: Noto Sans Shavian (SIL OFL)",
      bDict: "CMUdict",
      bGuess: "rule-based guess",
      bName: "proper noun",
      bNum: "number",
      bAbbrev: "abbreviation",
      bSpell: "initialism — spelled letter by letter",
      bMixed: "Latin original",
      kShavian: "Shavian",
      kIpa: "IPA",
      kSpoken: "Read as",
      kEnglish: "English",
      kHomophones: "Homophones",
      kDefault: "default",
      kVariant: "variant",
      phEn: "Type English here\u2026",
      phSh: "Type Shavian here\u2026"
    },

    "zh-Hans": {
      title: "萧伯纳字母转写器",
      tagline: "英语 ⇄ 萧伯纳字母 · 基于 CMUdict，支持美式 / 英式发音、IPA 与双向转写",
      dirFwd: "英语 → 萧伯纳字母",
      dirRev: "萧伯纳字母 → 英语",
      accent: "口音",
      modeUs: "美式通用发音（卷舌）",
      modeUk: "英式 RP（不卷舌）",
      optAbbrev: "常用词缩写（the/to/of/and/for）",
      optNamer: "专名中点（namer dot）",
      optNameStart: "句首大写词也按专名处理",
      inEn: "输入英语",
      inSh: "输入萧伯纳字母",
      outSh: "萧伯纳字母",
      outEn: "英语",
      sample: "示例",
      clear: "清空",
      copy: "复制结果",
      copied: "已复制",
      langLabel: "界面语言",
      warnOov: "以下词不在 CMUdict 中，按字母—读音规则推测：",
      warnSeg: "以下萧伯纳词无法整词匹配，按切分 / 推拼处理：",
      chartTitle: "字母表（Unicode U+10450–U+1047F）",
      gTall: "高字母（清辅音）",
      gDeep: "深字母（浊辅音）",
      gShort: "短字母（元音、流音、鼻音）",
      gLig: "连字（r 化元音等）",
      stats: "词典规模：{words} 词条 · {rev} 个反向读音键",
      footerData: "数据：CMU 发音词典 0.7b · 字体：Noto Sans Shavian（SIL OFL）",
      bDict: "CMUdict 词典",
      bGuess: "规则推测",
      bName: "专名",
      bNum: "数字",
      bAbbrev: "缩写",
      bSpell: "首字母缩写，逐字母拼读",
      bMixed: "拉丁原名",
      kShavian: "萧伯纳字母",
      kIpa: "国际音标",
      kSpoken: "读作",
      kEnglish: "英语",
      kHomophones: "同音异形词",
      kDefault: "默认读音",
      kVariant: "异读",
      phEn: "在此输入英语……",
      phSh: "在此输入萧伯纳字母……"
    },

    "zh-Hant": {
      title: "蕭伯納字母轉寫器",
      tagline: "英語 ⇄ 蕭伯納字母 · 基於 CMUdict，支援美式 / 英式發音、IPA 與雙向轉寫",
      dirFwd: "英語 → 蕭伯納字母",
      dirRev: "蕭伯納字母 → 英語",
      accent: "口音",
      modeUs: "美式通用發音（捲舌）",
      modeUk: "英式 RP（不捲舌）",
      optAbbrev: "常用詞縮寫（the/to/of/and/for）",
      optNamer: "專名中點（namer dot）",
      optNameStart: "句首大寫詞也按專名處理",
      inEn: "輸入英語",
      inSh: "輸入蕭伯納字母",
      outSh: "蕭伯納字母",
      outEn: "英語",
      sample: "範例",
      clear: "清空",
      copy: "複製結果",
      copied: "已複製",
      langLabel: "介面語言",
      warnOov: "以下詞不在 CMUdict 中，按字母—讀音規則推測：",
      warnSeg: "以下蕭伯納詞無法整詞匹配，按切分 / 推拼處理：",
      chartTitle: "字母表（Unicode U+10450–U+1047F）",
      gTall: "高字母（清輔音）",
      gDeep: "深字母（濁輔音）",
      gShort: "短字母（元音、流音、鼻音）",
      gLig: "連字（r 化元音等）",
      stats: "詞典規模：{words} 詞條 · {rev} 個反向讀音鍵",
      footerData: "資料：CMU 發音詞典 0.7b · 字型：Noto Sans Shavian（SIL OFL）",
      bDict: "CMUdict 詞典",
      bGuess: "規則推測",
      bName: "專名",
      bNum: "數字",
      bAbbrev: "縮寫",
      bSpell: "首字母縮寫，逐字母拼讀",
      bMixed: "拉丁原名",
      kShavian: "蕭伯納字母",
      kIpa: "國際音標",
      kSpoken: "讀作",
      kEnglish: "英語",
      kHomophones: "同音異形詞",
      kDefault: "預設讀音",
      kVariant: "異讀",
      phEn: "在此輸入英語……",
      phSh: "在此輸入蕭伯納字母……"
    },

    ja: {
      title: "ショー文字変換ツール",
      tagline: "英語 ⇄ ショー文字（Shavian alphabet）・CMUdict ベース、米語 / RP 発音、IPA、双方向変換",
      dirFwd: "英語 → ショー文字",
      dirRev: "ショー文字 → 英語",
      accent: "アクセント",
      modeUs: "米国 General American（R 音あり）",
      modeUk: "英国 RP（R 音なし）",
      optAbbrev: "略語（the/to/of/and/for）",
      optNamer: "固有名詞のネーマードット",
      optNameStart: "文頭の大文字も固有名詞として扱う",
      inEn: "英語の入力",
      inSh: "ショー文字の入力",
      outSh: "ショー文字",
      outEn: "英語",
      sample: "例",
      clear: "クリア",
      copy: "結果をコピー",
      copied: "コピーしました",
      langLabel: "表示言語",
      warnOov: "CMUdict にない語（文字—音素規則で推定）：",
      warnSeg: "単語全体では一致せず、分割 / 再綴りした語：",
      chartTitle: "字母表（Unicode U+10450–U+1047F）",
      gTall: "長い文字（無声子音）",
      gDeep: "下へ長い文字（有声子音）",
      gShort: "短い文字（母音・流音・鼻音）",
      gLig: "合字（R 化母音など）",
      stats: "辞書：{words} 項目・逆引きキー {rev} 件",
      footerData: "データ：CMU Pronouncing Dictionary 0.7b・フォント：Noto Sans Shavian（SIL OFL）",
      bDict: "CMUdict",
      bGuess: "規則による推定",
      bName: "固有名詞",
      bNum: "数字",
      bAbbrev: "略語",
      bSpell: "頭文字（1文字ずつの読み）",
      bMixed: "ラテン文字原文",
      kShavian: "ショー文字",
      kIpa: "IPA",
      kSpoken: "読み",
      kEnglish: "英語",
      kHomophones: "同綴り同音の別語",
      kDefault: "標準の発音",
      kVariant: "別発音",
      phEn: "ここに英語を入力…",
      phSh: "ここにショー文字を入力…"
    },

    fr: {
      title: "Translittérateur shavien",
      tagline: "Anglais ⇄ alphabet shavien · Basé sur CMUdict, avec prononciations General American / RP, API et conversion bidirectionnelle",
      dirFwd: "Anglais → shavien",
      dirRev: "Shavien → anglais",
      accent: "Accent",
      modeUs: "General American (rhotique)",
      modeUk: "RP britannique (non rhotique)",
      optAbbrev: "Abréviations (the/to/of/and/for)",
      optNamer: "Point des noms propres",
      optNameStart: "Considérer les majuscules en début de phrase comme des noms propres",
      inEn: "Texte anglais",
      inSh: "Texte shavien",
      outSh: "Shavien",
      outEn: "Anglais",
      sample: "Exemple",
      clear: "Effacer",
      copy: "Copier le résultat",
      copied: "Copié",
      langLabel: "Langue",
      warnOov: "Absents de CMUdict — déduits par les règles lettre/son : ",
      warnSeg: "Sans correspondance directe — segmentés / réorthographiés : ",
      chartTitle: "Alphabet (Unicode U+10450–U+1047F)",
      gTall: "Lettres hautes (consonnes sourdes)",
      gDeep: "Lettres basses (consonnes sonores)",
      gShort: "Lettres courtes (voyelles, liquides, nasales)",
      gLig: "Ligatures (voyelles rhotiques, etc.)",
      stats: "Dictionnaire : {words} entrées · {rev} clés inverses",
      footerData: "Données : CMU Pronouncing Dictionary 0.7b · Police : Noto Sans Shavian (SIL OFL)",
      bDict: "CMUdict",
      bGuess: "déduction par règles",
      bName: "nom propre",
      bNum: "nombre",
      bAbbrev: "abréviation",
      bSpell: "sigle, épelé lettre par lettre",
      bMixed: "original latin",
      kShavian: "Shavien",
      kIpa: "API",
      kSpoken: "Prononcé",
      kEnglish: "Anglais",
      kHomophones: "Homophones",
      kDefault: "prononciation par défaut",
      kVariant: "variante",
      phEn: "Saisissez l'anglais ici…",
      phSh: "Saisissez le shavien ici…"
    },

    es: {
      title: "Transliterador shaviano",
      tagline: "Inglés ⇄ alfabeto shaviano · Basado en CMUdict, con pronunciación General American / RP, IPA y conversión bidireccional",
      dirFwd: "Inglés → shaviano",
      dirRev: "Shaviano → inglés",
      accent: "Acento",
      modeUs: "General American (rótico)",
      modeUk: "RP británico (no rótico)",
      optAbbrev: "Abreviaturas (the/to/of/and/for)",
      optNamer: "Punto de nombres propios",
      optNameStart: "Tratar las mayúsculas al inicio de frase como nombres propios",
      inEn: "Entrada en inglés",
      inSh: "Entrada en shaviano",
      outSh: "Shaviano",
      outEn: "Inglés",
      sample: "Ejemplo",
      clear: "Borrar",
      copy: "Copiar resultado",
      copied: "Copiado",
      langLabel: "Idioma",
      warnOov: "No están en CMUdict — estimados por reglas letra-sonido: ",
      warnSeg: "Sin coincidencia de palabra completa — segmentados / reescritos: ",
      chartTitle: "Alfabeto (Unicode U+10450–U+1047F)",
      gTall: "Letras altas (consonantes sordas)",
      gDeep: "Letras profundas (consonantes sonoras)",
      gShort: "Letras cortas (vocales, líquidas, nasales)",
      gLig: "Ligaduras (vocales róticas, etc.)",
      stats: "Léxico: {words} entradas · {rev} claves inversas",
      footerData: "Datos: CMU Pronouncing Dictionary 0.7b · Fuente: Noto Sans Shavian (SIL OFL)",
      bDict: "CMUdict",
      bGuess: "estimado por reglas",
      bName: "nombre propio",
      bNum: "número",
      bAbbrev: "abreviatura",
      bSpell: "sigla, deletreada letra por letra",
      bMixed: "original latino",
      kShavian: "Shaviano",
      kIpa: "IPA",
      kSpoken: "Leído como",
      kEnglish: "Inglés",
      kHomophones: "Homófonos",
      kDefault: "pronunciación predeterminada",
      kVariant: "variante",
      phEn: "Escribe inglés aquí…",
      phSh: "Escribe shaviano aquí…"
    },

    de: {
      title: "Shaw-Transkribierer",
      tagline: "Englisch ⇄ Shaw-Alphabet · Auf CMUdict-Basis, mit General-American-/RP-Aussprache, IPA und bidirektionaler Umwandlung",
      dirFwd: "Englisch → Shaw",
      dirRev: "Shaw → Englisch",
      accent: "Akzent",
      modeUs: "General American (rhotisch)",
      modeUk: "Britisches RP (nicht-rhotisch)",
      optAbbrev: "Abkürzungen (the/to/of/and/for)",
      optNamer: "Namenspunkt für Eigennamen",
      optNameStart: "Großgeschriebene Wörter am Satzanfang als Eigennamen behandeln",
      inEn: "Englische Eingabe",
      inSh: "Shaw-Eingabe",
      outSh: "Shaw",
      outEn: "Englisch",
      sample: "Beispiel",
      clear: "Leeren",
      copy: "Ergebnis kopieren",
      copied: "Kopiert",
      langLabel: "Sprache",
      warnOov: "Nicht in CMUdict – über Buchstaben-Laut-Regeln erschlossen: ",
      warnSeg: "Keine Ganzworttreffer – segmentiert / neu buchstabiert: ",
      chartTitle: "Alphabet (Unicode U+10450–U+1047F)",
      gTall: "Hohe Buchstaben (stimmlose Konsonanten)",
      gDeep: "Tiefe Buchstaben (stimmhafte Konsonanten)",
      gShort: "Kurze Buchstaben (Vokale, Liquiden, Nasale)",
      gLig: "Ligaturen (r-Vokale u. a.)",
      stats: "Lexikon: {words} Einträge · {rev} Umkehrschlüssel",
      footerData: "Daten: CMU Pronouncing Dictionary 0.7b · Schriftart: Noto Sans Shavian (SIL OFL)",
      bDict: "CMUdict",
      bGuess: "Regelerschließung",
      bName: "Eigenname",
      bNum: "Zahl",
      bAbbrev: "Abkürzung",
      bSpell: "Initialwort, Buchstabe für Buchstabe",
      bMixed: "lateinisches Original",
      kShavian: "Shaw",
      kIpa: "IPA",
      kSpoken: "Gelesen als",
      kEnglish: "Englisch",
      kHomophones: "Homophone",
      kDefault: "Standardaussprache",
      kVariant: "Variante",
      phEn: "Hier Englisch eingeben …",
      phSh: "Hier Shaw eingeben …"
    },

    it: {
      title: "Traslitteratore shaviano",
      tagline: "Inglese ⇄ alfabeto shaviano · Basato su CMUdict, con pronunce General American / RP, IPA e conversione bidirezionale",
      dirFwd: "Inglese → shaviano",
      dirRev: "Shaviano → inglese",
      accent: "Accento",
      modeUs: "General American (rotico)",
      modeUk: "RP britannico (non rotico)",
      optAbbrev: "Abbreviazioni (the/to/of/and/for)",
      optNamer: "Punto dei nomi propri",
      optNameStart: "Tratta le maiuscole a inizio frase come nomi propri",
      inEn: "Testo in inglese",
      inSh: "Testo in shaviano",
      outSh: "Shaviano",
      outEn: "Inglese",
      sample: "Esempio",
      clear: "Cancella",
      copy: "Copia il risultato",
      copied: "Copiato",
      langLabel: "Lingua",
      warnOov: "Non nel CMUdict — ricostruiti con regole lettera-suono: ",
      warnSeg: "Nessuna corrispondenza per parola intera — segmentati / rifusi: ",
      chartTitle: "Alfabeto (Unicode U+10450–U+1047F)",
      gTall: "Lettere alte (consonanti sorde)",
      gDeep: "Lettere profonde (consonanti sonore)",
      gShort: "Lettere corte (vocali, liquide, nasali)",
      gLig: "Legature (vocali rotiche ecc.)",
      stats: "Lessico: {words} voci · {rev} chiavi inverse",
      footerData: "Dati: CMU Pronouncing Dictionary 0.7b · Font: Noto Sans Shavian (SIL OFL)",
      bDict: "CMUdict",
      bGuess: "ricostruito da regole",
      bName: "nome proprio",
      bNum: "numero",
      bAbbrev: "abbreviazione",
      bSpell: "sigla, lettera per lettera",
      bMixed: "originale latino",
      kShavian: "Shaviano",
      kIpa: "IPA",
      kSpoken: "Letto come",
      kEnglish: "Inglese",
      kHomophones: "Omofoni",
      kDefault: "pronuncia predefinita",
      kVariant: "variante",
      phEn: "Scrivi qui l'inglese…",
      phSh: "Scrivi qui lo shaviano…"
    }
  };

  var current = EN;

  function t(key, vars) {
    var table = MESSAGES[current] || MESSAGES.en;
    var s = table[key] !== undefined ? table[key]
      : (MESSAGES.en[key] !== undefined ? MESSAGES.en[key] : key);
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] !== undefined ? vars[k] : "";
      });
    }
    return s;
  }

  function apply(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    (root || document).querySelectorAll("[data-i18n-ph]").forEach(function (node) {
      node.setAttribute("placeholder", t(node.getAttribute("data-i18n-ph")));
    });
    (root || document).querySelectorAll("[data-i18n-title]").forEach(function (node) {
      node.setAttribute("title", t(node.getAttribute("data-i18n-title")));
    });
    (root || document).querySelectorAll("[data-i18n-aria]").forEach(function (node) {
      node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria")));
    });
  }

  function setLang(lang, opts) {
    if (MESSAGES[lang]) { current = lang; }
    if (!opts || opts.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* private mode */ }
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang",
        current === "zh-Hans" ? "zh-Hans" :
        current === "zh-Hant" ? "zh-Hant" : current);
      apply(document);
      if (document.title) { document.title = t("title"); }
    }
    if (!opts || !opts.silent) {
      listeners.slice().forEach(function (fn) { try { fn(current); } catch (e) {} });
    }
  }

  function getLang() { return current; }

  function onChange(fn) { listeners.push(fn); }

  function savedLang() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return MESSAGES[v] ? v : null;
    } catch (e) { return null; }
  }

  return {
    t: t,
    apply: apply,
    setLang: setLang,
    getLang: getLang,
    onChange: onChange,
    savedLang: savedLang,
    languages: ORDER.slice(),
    langName: function (l) { return LANG_NAMES[l] || l; },
    STORAGE_KEY: STORAGE_KEY
  };
});
