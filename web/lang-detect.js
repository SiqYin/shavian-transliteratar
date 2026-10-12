/* Language detection for the Shavian Transliteratar.
 *
 * Web page  : geo-IP only.
 *   Mainland China -> zh-Hans, HK/Macau/Taiwan -> zh-Hant, Japan -> ja,
 *   French-speaking countries -> fr, German-speaking countries (DE/AT/LI) -> de,
 *   countries where Spanish or Portuguese is official -> es, Italy -> it.
 *   English-speaking countries, unassigned regions and countries with two or
 *   more of the candidate official languages (Switzerland, Belgium, Canada,
 *   Luxembourg, Cameroon, ...) fall back to English.
 *
 * Installed app (PC/Android, PWA standalone): the OS/browser UI language is
 * checked first; only when it is not one of the eight offered languages does
 * geo-IP decide.
 *
 * Works in the browser and in Node (the mapping functions are exported).
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module !== null && typeof module.exports !== "undefined") {
    module.exports = api;
  }
  if (root) { root.LANGDETECT = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EN = "en", HANS = "zh-Hans", HANT = "zh-Hant",
      JA = "ja", FR = "fr", ES = "es", DE = "de", IT = "it";

  var SUPPORTED = [EN, HANS, HANT, JA, FR, ES, DE, IT];

  /* Explicit mapping. Only countries resolving to a non-English UI are listed,
   * plus multi-language countries pinned to EN on purpose. Anything absent
   * (including all English-speaking countries) defaults to English. */
  var COUNTRY_MAP = {
    CN: HANS,
    HK: HANT, MO: HANT, TW: HANT,
    JP: JA,
    // French as the only candidate official language
    FR: FR, MC: FR, HT: FR,
    BF: FR, BJ: FR, CF: FR, CG: FR, CI: FR, CD: FR, KM: FR, DJ: FR,
    GA: FR, GF: FR, GN: FR, GP: FR, MQ: FR, ML: FR, NE: FR, NC: FR,
    PF: FR, PM: FR, RE: FR, BL: FR, MF: FR, SN: FR, TD: FR, TG: FR,
    WF: FR, YT: FR, MG: FR,
    // German-speaking (single-language) countries
    DE: DE, AT: DE, LI: DE,
    // Spanish as official
    ES: ES, AR: ES, BO: ES, CL: ES, CO: ES, CR: ES, CU: ES, DO: ES,
    EC: ES, SV: ES, GT: ES, HN: ES, MX: ES, NI: ES, PA: ES, PY: ES,
    PE: ES, PR: ES, UY: ES, VE: ES,
    // Portuguese as official -> Spanish UI by product rule
    PT: ES, BR: ES, AO: ES, MZ: ES, CV: ES, GW: ES, ST: ES, TL: ES,
    // Italian as the only candidate official language
    IT: IT, SM: IT, VA: IT,
    // ---- pinned to English: two or more candidate languages are official ----
    CH: EN,   // German + French + Italian (+ Romansh)
    BE: EN,   // French + German (Dutch is not offered)
    LU: EN,   // German + French (+ Luxembourgish)
    CA: EN,   // English + French
    CM: EN,   // English + French
    GQ: EN,   // Spanish + French + Portuguese
    BI: EN,   // French + English (since 2021)
    BZ: EN,   // English official, Spanish widely used
    SC: EN,   // English + French (+ Seychellois Creole)
    MU: EN,   // English is the official language; French widely used
    VU: EN    // English + French (+ Bislama)
  };

  function countryToLang(cc) {
    if (!cc) { return EN; }
    var v = COUNTRY_MAP[String(cc).toUpperCase()];
    return v || EN;
  }

  /* Map a BCP 47 UI language (navigator.language) onto a supported locale.
   * Returns null when no offered language matches — note that Portuguese is
   * NOT mapped to Spanish: the app rule only does that for geo-IP countries. */
  function systemToLang(tag) {
    if (!tag) { return null; }
    var s = String(tag).toLowerCase();
    var lang = s.split("-")[0];
    if (lang === "en") { return EN; }
    if (lang === "ja") { return JA; }
    if (lang === "fr") { return FR; }
    if (lang === "es") { return ES; }
    if (lang === "de") { return DE; }
    if (lang === "it") { return IT; }
    if (lang === "zh") {
      if (/(tw|hk|mo|hant)/.test(s)) { return HANT; }
      return HANS;
    }
    return null;
  }

  function systemLanguage() {
    if (typeof navigator === "undefined") { return null; }
    var tags = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    for (var i = 0; i < tags.length; i++) {
      var hit = systemToLang(tags[i]);
      if (hit) { return hit; }
    }
    return null;
  }

  function fetchJson(url, ms) {
    if (typeof fetch !== "function") { return Promise.reject(new Error("no fetch")); }
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 5000) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { if (!r.ok) { throw new Error("HTTP " + r.status); } return r.json(); })
      .then(function (j) {
        if (timer) { clearTimeout(timer); }
        return j;
      })
      .catch(function (e) {
        if (timer) { clearTimeout(timer); }
        throw e;
      });
  }

  // Each resolver normalises a different provider onto an ISO-3166 alpha-2 code.
  var RESOLVERS = [
    function () { return fetchJson("https://ipwho.is/", 5000).then(function (j) { return j && j.country_code; }); },
    function () { return fetchJson("https://get.geojs.io/v1/ip/country.json", 5000).then(function (j) { return j && j.country; }); },
    function () { return fetchJson("https://api.country.is/", 5000).then(function (j) { return j && j.country; }); }
  ];

  function geoLanguage() {
    var p = Promise.resolve(null);
    RESOLVERS.forEach(function (resolve) {
      p = p.then(function (cc) {
        if (cc) { return cc; }
        return resolve().catch(function () { return null; });
      });
    });
    return p.then(function (cc) { return countryToLang(cc); })
      .catch(function () { return EN; });
  }

  function isStandaloneApp() {
    if (typeof window === "undefined" || !window.matchMedia) { return false; }
    // installed PWA (display-mode) or the packaged Windows / Android shell,
    // which loads the page over file://
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator && window.navigator.standalone === true ||
           typeof location !== "undefined" && location.protocol === "file:";
  }

  /* mode: "web" forces geo-IP, "app" checks the system language first; when
   * omitted, installed PWA behaves as an app and a browser tab as the web. */
  function detectLanguage(mode) {
    var appMode = mode === "app" || (mode !== "web" && isStandaloneApp());
    if (appMode) {
      var sys = systemLanguage();
      if (sys) { return Promise.resolve(sys); }
    }
    return geoLanguage();
  }

  return {
    SUPPORTED: SUPPORTED,
    EN: EN, HANS: HANS, HANT: HANT, JA: JA, FR: FR, ES: ES, DE: DE, IT: IT,
    countryToLang: countryToLang,
    systemToLang: systemToLang,
    systemLanguage: systemLanguage,
    geoLanguage: geoLanguage,
    detectLanguage: detectLanguage,
    isStandaloneApp: isStandaloneApp
  };
});
