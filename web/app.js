/* Shavian Transliteratar — browser UI.
 * Depends on window.SHAVIAN (engine.js + tables.js + data.js), I18N, LANGDETECT. */
(function () {
  "use strict";
  var S = window.SHAVIAN, I18N = window.I18N, LANGDETECT = window.LANGDETECT;
  var t = function () { return I18N.t.apply(I18N, arguments); };

  // The demo text is tool input, so it stays English in every UI locale.
  var SAMPLE_EN = "I met John in New York last Friday. The quick brown fox jumps over 13 lazy dogs! Read this either in General American or in RP English.";

  var state = { dir: "fwd", variantPick: {}, sampleLoaded: false };

  var $ = function (id) { return document.getElementById(id); };
  var inputEl = $("input"), outputEl = $("output"), ipaEl = $("ipaLine"),
      warnEl = $("warnLine"), detailEl = $("detail"), detailBody = $("detailBody");

  function fwdOpts() {
    return {
      mode: document.querySelector('input[name="mode"]:checked').value,
      abbrev: $("optAbbrev").checked,
      namerDot: $("optNamer").checked,
      nameAtStart: $("optNameStart").checked,
      variants: state.variantPick
    };
  }

  /* Pair whitespace / token runs of the rendered string with the engine's
   * words[] queue. */
  var WORDY_RE = /[A-Za-z0-9\u{10450}-\u{1047F}]/u;
  function pairTokens(text, words) {
    var runs = text.match(/\S+|\s+/g) || [];
    var qi = 0, out = [];
    runs.forEach(function (run) {
      if (/^\s+$/.test(run) || !WORDY_RE.test(run)) {
        out.push({ text: run, word: null });
      } else {
        out.push({ text: run, word: words[qi++] || null });
      }
    });
    return out;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }

  var selectedToken = null;

  function renderForward() {
    var text = inputEl.value;
    outputEl.innerHTML = "";
    detailEl.hidden = true;
    selectedToken = null;
    if (!text.trim()) {
      ipaEl.hidden = true;
      warnEl.hidden = true;
      return;
    }
    var res = S.textToShavian(text, fwdOpts());
    pairTokens(res.shavian, res.words).forEach(function (pair) {
      if (!pair.word) { outputEl.appendChild(document.createTextNode(pair.text)); return; }
      var w = pair.word;
      var cls = "w";
      if (w.status === "guess") { cls += " guess"; }
      if (w.proper) { cls += " name"; }
      if (w.status === "abbrev") { cls += " abbrev"; }
      if (w.status === "num") { cls += " num"; }
      if (w.status === "spell") { cls += " spell"; }
      var span = el("span", cls, pair.text);
      span.addEventListener("click", function () { selectForward(span, w); });
      outputEl.appendChild(span);
    });

    ipaEl.hidden = !res.ipa;
    ipaEl.textContent = res.ipa;

    if (res.unknown.length) {
      warnEl.hidden = false;
      warnEl.innerHTML = "";
      warnEl.appendChild(document.createTextNode(t("warnOov")));
      res.unknown.forEach(function (w) { warnEl.appendChild(el("code", "", w)); });
    } else {
      warnEl.hidden = true;
    }
  }

  function statusBadge(w) {
    if (w.status === "abbrev") return ["abbrev", t("bAbbrev")];
    if (w.proper) return ["name", t("bName")];
    if (w.status === "num") return ["num", t("bNum")];
    if (w.status === "spell") return ["spell", t("bSpell")];
    if (w.status === "guess") return ["guess", t("bGuess")];
    return ["dict", t("bDict")];
  }

  function selectForward(span, w) {
    if (selectedToken) { selectedToken.classList.remove("sel"); }
    span.classList.add("sel");
    selectedToken = span;
    detailEl.hidden = false;
    detailBody.innerHTML = "";

    var head = el("h3", "", w.src);
    var badge = statusBadge(w);
    head.appendChild(el("span", "badge badge-" + badge[0], badge[1]));
    detailBody.appendChild(head);

    if (w.proper && w.shavian) {
      var shRow = el("div", "row");
      shRow.appendChild(el("span", "k", t("kShavian")));
      shRow.appendChild(el("span", "sh big-sh", w.shavian));
      detailBody.appendChild(shRow);
    }
    if (w.ipa) {
      var ipaRow = el("div", "row");
      ipaRow.appendChild(el("span", "k", t("kIpa")));
      ipaRow.appendChild(el("span", "", "/" + w.ipa + "/"));
      detailBody.appendChild(ipaRow);
    }
    if (w.spoken) {
      var spRow = el("div", "row");
      spRow.appendChild(el("span", "k", t("kSpoken")));
      spRow.appendChild(el("span", "", w.spoken));
      detailBody.appendChild(spRow);
    }

    var variants = w.variants || [];
    if (variants.length) {
      var key = (w.word || w.src || "").toLowerCase().replace(/[\u2019]/g, "'");
      var box = el("div", "variant-btns");
      var chosen = w.chosen || 0;
      function vbtn(label, idx) {
        var b = el("button", chosen === idx ? "is-on" : "", label);
        b.addEventListener("click", function () {
          if (idx === 0) { delete state.variantPick[key]; }
          else { state.variantPick[key] = idx; }
          renderForward();
        });
        return b;
      }
      box.appendChild(vbtn(t("kDefault") + " /" + S.phonesToIPA(w.phones) + "/", 0));
      variants.forEach(function (v, i) {
        box.appendChild(vbtn(t("kVariant") + " " + (i + 1) + " /" + S.phonesToIPA(v) + "/", i + 1));
      });
      detailBody.appendChild(box);
    }
  }

  function renderReverse() {
    var text = inputEl.value;
    outputEl.innerHTML = "";
    detailEl.hidden = true;
    ipaEl.hidden = true;
    selectedToken = null;
    if (!text.trim()) { warnEl.hidden = true; return; }
    var res = S.shavianToEnglish(text, {});
    pairTokens(res.english, res.words).forEach(function (pair) {
      if (!pair.word) { outputEl.appendChild(document.createTextNode(pair.text)); return; }
      var w = pair.word;
      var cls = "w";
      if (w.status === "guess" || w.complete === false) { cls += " guess-flag"; }
      var span = el("span", cls, pair.text);
      span.title = w.status === "guess" ? t("bGuess") : "";
      span.addEventListener("click", function () { selectReverse(span, w); });
      outputEl.appendChild(span);
    });

    var guessed = res.words.filter(function (w) { return w.status === "guess" || w.complete === false; });
    if (guessed.length) {
      warnEl.hidden = false;
      warnEl.innerHTML = "";
      warnEl.appendChild(document.createTextNode(t("warnSeg")));
      guessed.forEach(function (w) {
        warnEl.appendChild(el("code", "sh", w.src + " \u2192 " + w.text));
      });
    } else {
      warnEl.hidden = true;
    }
  }

  function selectReverse(span, w) {
    if (selectedToken) { selectedToken.classList.remove("sel"); }
    span.classList.add("sel");
    selectedToken = span;
    detailEl.hidden = false;
    detailBody.innerHTML = "";

    var head = el("h3", "sh", w.src);
    var badge = w.status === "guess"
      ? ["guess", t("bGuess")]
      : (w.status === "mixed" ? ["name", t("bMixed")] : ["dict", t("bDict")]);
    head.appendChild(el("span", "badge badge-" + badge[0], badge[1]));
    detailBody.appendChild(head);

    var enRow = el("div", "row");
    enRow.appendChild(el("span", "k", t("kEnglish")));
    enRow.appendChild(el("span", "", w.text));
    detailBody.appendChild(enRow);

    if (w.ipa) {
      var ipaRow = el("div", "row");
      ipaRow.appendChild(el("span", "k", t("kIpa")));
      ipaRow.appendChild(el("span", "", "/" + w.ipa + "/"));
      detailBody.appendChild(ipaRow);
    }
    var alts = (w.cands || []).slice(1).filter(function (c) { return c.word && c.word !== w.text; });
    if (alts.length) {
      var altRow = el("div", "row");
      altRow.appendChild(el("span", "k", t("kHomophones")));
      altRow.appendChild(el("span", "", alts.map(function (c) { return c.word; }).join(", ")));
      detailBody.appendChild(altRow);
    }
  }

  function renderChart() {
    var groups = [
      ["tall", "gTall"], ["deep", "gDeep"], ["short", "gShort"], ["ligature", "gLig"]
    ];
    var chart = $("chart");
    chart.innerHTML = "";
    groups.forEach(function (g) {
      var wrap = el("div", "chart-group");
      wrap.appendChild(el("h4", "", t(g[1])));
      var grid = el("div", "letter-grid");
      S.T.letters.filter(function (l) { return l.k === g[0]; }).forEach(function (l) {
        var card = el("div", "letter-card");
        card.appendChild(el("div", "ch sh", l.c));
        card.appendChild(el("div", "nm", l.n));
        card.appendChild(el("div", "ip", "/" + l.ipa + "/"));
        card.appendChild(el("div", "ex", l.ex));
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      chart.appendChild(wrap);
    });
  }

  function updateChrome() {
    var fwd = state.dir === "fwd";
    $("optsFwd").style.display = fwd ? "" : "none";
    $("inputLabel").textContent = t(fwd ? "inEn" : "inSh");
    $("outputLabel").textContent = t(fwd ? "outSh" : "outEn");
    inputEl.placeholder = t(fwd ? "phEn" : "phSh");
    inputEl.classList.toggle("sh", !fwd);
    outputEl.classList.toggle("sh", fwd);
  }

  function setDir(dir) {
    state.dir = dir;
    document.querySelectorAll(".dir-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.dir === dir);
    });
    updateChrome();
    render();
  }

  function render() {
    updateChrome();
    if (state.dir === "fwd") { renderForward(); } else { renderReverse(); }
  }

  /* ------------------------------------------------------------- language */
  function buildLangSelect() {
    var sel = $("langSelect");
    I18N.languages.forEach(function (l) {
      var o = el("option", "", I18N.langName(l));
      o.value = l;
      sel.appendChild(o);
    });
    sel.value = I18N.getLang();
    sel.addEventListener("change", function () {
      I18N.setLang(sel.value);   // explicit choice is persisted and wins
    });
  }

  I18N.onChange(function (lang) {
    $("langSelect").value = lang;
    renderChart();
    renderStats();
    render();
  });

  function renderStats() {
    var stats = S.stats();
    $("stats").textContent = t("stats", {
      words: stats.words.toLocaleString(), rev: stats.rev.toLocaleString()
    });
  }

  /* ------------------------------------------------------------- events */
  document.querySelectorAll(".dir-btn").forEach(function (b) {
    b.addEventListener("click", function () { setDir(b.dataset.dir); });
  });
  inputEl.addEventListener("input", render);
  $("optsFwd").addEventListener("change", render);
  $("sampleBtn").addEventListener("click", function () {
    inputEl.value = SAMPLE_EN;
    if (state.dir === "rev") { inputEl.value = S.textToShavian(SAMPLE_EN, { mode: "us" }).shavian; }
    state.sampleLoaded = true;
    render();
  });
  $("clearBtn").addEventListener("click", function () {
    inputEl.value = "";
    state.variantPick = {};
    render();
    inputEl.focus();
  });
  var copyTimer = null;
  $("copyBtn").addEventListener("click", function () {
    var text = outputEl.textContent;
    if (navigator.clipboard && text) { navigator.clipboard.writeText(text); }
    var btn = $("copyBtn");
    btn.textContent = t("copied");
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { btn.textContent = t("copy"); }, 1200);
  });

  /* ---------------------------------------------------------------- init */
  function boot() {
    buildLangSelect();
    renderChart();
    renderStats();
    I18N.apply(document);
    inputEl.value = SAMPLE_EN;
    render();
    registerServiceWorker();
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) { return; }
    var proto = location.protocol;
    if (proto !== "https:" && proto !== "file:" && location.hostname !== "127.0.0.1" &&
        location.hostname !== "localhost") { return; }
    if (proto === "file:") { return; }
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline unsupported */ });
    });
  }

  // Manual choice always wins; otherwise the web uses geo-IP and an installed
  // PWA checks the system language first.
  var saved = I18N.savedLang();
  if (saved) {
    I18N.setLang(saved, { silent: false });
    boot();
  } else {
    I18N.setLang("en", { silent: true, persist: false });
    boot();
    LANGDETECT.detectLanguage().then(function (lang) {
      if (!I18N.savedLang()) { I18N.setLang(lang); }
    }).catch(function () { /* English stays */ });
  }
})();
