# -*- coding: utf-8 -*-
"""Single source of truth for the Shavian <-> ARPABET <-> IPA mapping.

Letter table follows en.wikipedia.org/wiki/Shavian_alphabet (Unicode 4.0 block
U+10450..U+1047F) cross-checked against zh.wikipedia.org/wiki/蕭伯納字母.

ARPABET side comes from CMUdict (en-US).  Two dialect renderings are produced:

  us  General American, rhotic          ER -> Array 𐑼  /ər/
  uk  Received Pronunciation, non-rhotic  ER -> Err 𐑻 (stressed) / Ado 𐑩 (reduced)
"""

# ---------------------------------------------------------------- Shavian letters
# (char, name, ipa, kind, arpabet_primary, arpabet_alternatives, mnemonic/example)
LETTERS = [
    # --- tall (voiceless consonants) ---
    ("\U00010450", "Peep",    "p",  "tall",  "P",   [],          "peep /p/ as in pea"),
    ("\U00010451", "Tot",     "t",  "tall",  "T",   [],          "tot /t/ as in top"),
    ("\U00010452", "Kick",    "k",  "tall",  "K",   [],          "kick /k/ as in cat"),
    ("\U00010453", "Fee",     "f",  "tall",  "F",   [],          "fee /f/ as in fan"),
    ("\U00010454", "Thigh",   "\u03b8", "tall", "TH", [],      "thigh /\u03b8/ as in think"),
    ("\U00010455", "So",      "s",  "tall",  "S",   [],          "so /s/ as in sip"),
    ("\U00010456", "Sure",    "\u0283", "tall", "SH", [],      "sure /\u0283/ as in ship"),
    ("\U00010457", "Church",  "t\u0283", "tall", "CH", [],    "church /t\u0283/ as in chip"),
    ("\U00010458", "Yea",     "j",  "tall",  "Y",   [],          "yea /j/ as in yes"),
    ("\U00010459", "Hung",    "\u014b", "tall", "NG", [],      "hung /\u014b/ as in sing"),
    # --- deep (voiced partners, tall letters rotated) ---
    ("\U0001045A", "Bib",     "b",  "deep",  "B",   [],          "bib /b/ as in bed"),
    ("\U0001045B", "Dead",    "d",  "deep",  "D",   [],          "dead /d/ as in dog"),
    ("\U0001045C", "Gag",     "\u0261", "deep", "G",   [],        "gag /\u0261/ as in go"),
    ("\U0001045D", "Vow",     "v",  "deep",  "V",   [],          "vow /v/ as in vote"),
    ("\U0001045E", "They",    "\u00f0", "deep", "DH", [],      "they /\u00f0/ as in this"),
    ("\U0001045F", "Zoo",     "z",  "deep",  "Z",   [],          "zoo /z/ as in zip"),
    ("\U00010460", "Measure", "\u0292", "deep", "ZH", [],      "measure /\u0292/ as in vision"),
    ("\U00010461", "Judge",   "d\u0292", "deep", "JH", [],    "judge /d\u0292/ as in jam"),
    ("\U00010462", "Woe",     "w",  "deep",  "W",   [],          "woe /w/ as in wet"),
    ("\U00010463", "Ha-ha",   "h",  "deep",  "HH",  [],          "ha-ha /h/ as in hat"),
    # --- short: Loll/Roar, Mime/Nun, If/Eat, Egg/Age, Ash/Ice, Ado/Up,
    #            On/Oak, Wool/Ooze, Out/Oil, Ah/Awe  (Wikipedia pairing order) ---
    ("\U00010464", "Loll",    "l",  "short", "L",   [],          "loll /l/ as in let"),
    ("\U0001046E", "Roar",    "\u0279", "short", "R",   [],      "roar /\u0279/ as in red"),
    ("\U00010465", "Mime",    "m",  "short", "M",   [],          "mime /m/ as in met"),
    ("\U0001046F", "Nun",     "n",  "short", "N",   [],          "nun /n/ as in net"),
    ("\U00010466", "If",      "\u026a", "short", "IH", [],      "if /\u026a/ as in bit"),
    ("\U00010470", "Eat",     "i\u02d0", "short", "IY", [],     "eat /i\u02d0/ as in be"),
    ("\U00010467", "Egg",     "\u025b", "short", "EH", [],      "egg /\u025b/ as in bet"),
    ("\U00010471", "Age",     "e\u026a", "short", "EY", [],     "age /e\u026a/ as in bay"),
    ("\U00010468", "Ash",     "\u00e6", "short", "AE", [],      "ash /\u00e6/ as in bat"),
    ("\U00010472", "Ice",     "a\u026a", "short", "AY", [],     "ice /a\u026a/ as in bite"),
    ("\U00010469", "Ado",     "\u0259", "short", "AX", [],      "ado /\u0259/ as in about"),
    ("\U00010473", "Up",      "\u028a", "short", "AH", [],      "up /\u028a/ as in cup"),
    ("\U0001046A", "On",      "\u0252", "short", "UH", [],      "on /\u0252/ as in hot (US: AH/UH)"),
    ("\U00010474", "Oak",     "o\u028a", "short", "OW", [],    "oak /o\u028a/ as in go"),
    ("\U0001046B", "Wool",    "\u028a", "short", "UH", [],      "wool /\u028a/ as in book"),
    ("\U00010475", "Ooze",    "u\u02d0", "short", "UW", [],     "ooze /u\u02d0/ as in boot"),
    ("\U0001046C", "Out",     "a\u028a", "short", "AW", [],    "out /a\u028a/ as in how"),
    ("\U00010476", "Oil",     "\u0254\u026a", "short", "OY", [], "oil /\u0254\u026a/ as in boy"),
    ("\U0001046D", "Ah",      "\u0251\u02d0", "short", "AA", [], "ah /\u0251\u02d0/ as in father"),
    ("\U00010477", "Awe",     "\u0254\u02d0", "short", "AO", [], "awe /\u0254\u02d0/ as in law"),
]

# Ligatures live in the U+10478.. range of the same block; they carry their own
# official names and are checked against unicodedata by tools/verify_chars.py.
LIGATURES = [
    ("\U00010478", "Are",   "\u0251\u02d0\u0279", "ligature", "AA", ["ER"], "\u0251\u02d0r - as in car"),
    ("\U00010479", "Or",    "\u0254\u02d0\u0279", "ligature", "AO", ["ER"], "\u0254\u02d0r - as in north"),
    ("\U0001047A", "Air",   "\u025b\u0259\u0279", "ligature", "EH", ["ER"], "\u025b\u0259r - as in air"),
    ("\U0001047B", "Err",   "\u025c\u02d0\u0279", "ligature", "ER", [],       "\u025c\u02d0r - as in work"),
    ("\U0001047C", "Array", "\u0259\u0279", "ligature", "ER", [],            "\u0259r - as in butter"),
    ("\U0001047D", "Ear",   "\u026a\u0259\u0279", "ligature", "IH", ["ER"], "\u026a\u0259r - as in ear"),
    ("\U0001047E", "Ian",   "i\u0259", "ligature", "IY", ["ER"],           "i\u0259 - as in Ian"),
    ("\U0001047F", "Yew",   "ju\u02d0", "ligature", "UW", [],             "ju\u02d0 - as in hue"),
]

SHAVIAN_ABBREV = {
    "the": "\U0001045E",   # They
    "of":  "\U0001045D",   # Vow
    "and": "\U0001045F",   # Zoo
    "to":  "\U00010451",   # Tot
    "for": "\U00010453",   # Fee
}

# ------------------------------------------------------------ ARPABET phone sets
VOWELS = {"AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY",
          "OW", "OY", "UH", "UW", "AX", "AXR"}
# phones whose syllable nucleus can be syllabic (m, n, l, r)
SYLLABIC_OK = {"M", "N", "L", "R"}

PHONES = ["AA", "AE", "AH", "AO", "AW", "AY", "B", "CH", "D", "DH", "EH", "ER",
          "EY", "F", "G", "HH", "IH", "IY", "JH", "K", "L", "M", "N", "NG",
          "OW", "OY", "P", "R", "S", "SH", "T", "TH", "UH", "UW", "V", "W",
          "Y", "Z", "ZH", "AX", "AXR"]

# ------------------------------------------------------------- IPA (US, broad)
IPA_US = {
    "AA": "\u0251", "AE": "\u00e6", "AH": "\u028c", "AO": "\u0254", "AW": "a\u028a",
    "AY": "a\u026a", "B": "b", "CH": "t\u0283", "D": "d", "DH": "\u00f0",
    "EH": "\u025b", "ER": "\u025a", "EY": "e\u026a", "F": "f", "G": "\u0261",
    "HH": "h", "IH": "\u026a", "IY": "i", "JH": "d\u0292", "K": "k", "L": "l",
    "M": "m", "N": "n", "NG": "\u014b", "OW": "o\u028a", "OY": "\u0254\u026a",
    "P": "p", "R": "\u0279", "S": "s", "SH": "\u0283", "T": "t", "TH": "\u03b8",
    "UH": "\u028a", "UW": "u", "V": "v", "W": "w", "Y": "j", "Z": "z",
    "ZH": "\u0292", "AX": "\u0259", "AXR": "\u025a",
}
# length / reduction adjustments, keyed by (phone, stress)
IPA_LONG = {"AA", "IY", "UW", "AO"}
IPA_REDUCED = {"AH": "\u0259", "AX": "\u0259", "AXR": "\u025a", "ER": "\u025a"}


def build_phone_to_shavian(mode="us"):
    """ARPABET -> Shavian char.

    mode 'us': General American, rhotic.
    mode 'uk': Received Pronunciation, non-rhotic (handled partly in JS for
               context-sensitive r-deletion; the static part is here).
    """
    ch = {c[0]: c[1] for c in LETTERS}
    name2ch = {c[1]: c[0] for c in LETTERS}
    lig = {c[1]: c[0] for c in LIGATURES}
    m = {
        "P": name2ch["Peep"], "B": name2ch["Bib"],
        "T": name2ch["Tot"], "D": name2ch["Dead"],
        "K": name2ch["Kick"], "G": name2ch["Gag"],
        "F": name2ch["Fee"], "V": name2ch["Vow"],
        "TH": name2ch["Thigh"], "DH": name2ch["They"],
        "S": name2ch["So"], "Z": name2ch["Zoo"],
        "SH": name2ch["Sure"], "ZH": name2ch["Measure"],
        "CH": name2ch["Church"], "JH": name2ch["Judge"],
        "Y": name2ch["Yea"], "W": name2ch["Woe"],
        "NG": name2ch["Hung"], "HH": name2ch["Ha-ha"],
        "L": name2ch["Loll"], "R": name2ch["Roar"],
        "M": name2ch["Mime"], "N": name2ch["Nun"],
        "IH": name2ch["If"], "IY": name2ch["Eat"],
        "EH": name2ch["Egg"], "EY": name2ch["Age"],
        "AE": name2ch["Ash"], "AY": name2ch["Ice"],
        "AX": name2ch["Ado"], "AH": name2ch["Up"],
        "OW": name2ch["Oak"], "UW": name2ch["Ooze"],
        "AW": name2ch["Out"], "OY": name2ch["Oil"],
        "AA": name2ch["Ah"], "AO": name2ch["Awe"],
        "UH": name2ch["Wool"] if mode == "us" else name2ch["On"],
    }
    if mode == "us":
        m["ER"] = lig["Array"]      # rhotic /ər/
        m["AXR"] = lig["Array"]
    else:
        m["ER"] = lig["Err"]        # RP /ɜː/ (reduced ER0 -> Ado is handled in JS)
        m["AXR"] = name2ch["Ado"]
    return m


def build_shavian_to_arpabet():
    """Shavian char -> candidate ARPABET phone sequences (ordered, best first).

    The reverse index is built from CMUdict, i.e. General American, so the
    Shavian cells whose Wikipedia value is purely RP (On /ɒ/, Wool /ʊ/) get a
    second candidate, and schwa (Ado) is matched against both AX and the very
    common unstressed AH of CMUdict.
    """
    m = {
        "\U00010450": ["P"], "\U00010451": ["T"], "\U00010452": ["K"],
        "\U00010453": ["F"], "\U00010454": ["TH"], "\U00010455": ["S"],
        "\U00010456": ["SH"], "\U00010457": ["CH"], "\U00010458": ["Y"],
        "\U00010459": ["NG"], "\U0001045A": ["B"], "\U0001045B": ["D"],
        "\U0001045C": ["G"], "\U0001045D": ["V"], "\U0001045E": ["DH"],
        "\U0001045F": ["Z"], "\U00010460": ["ZH"], "\U00010461": ["JH"],
        "\U00010462": ["W"], "\U00010463": ["HH"], "\U00010464": ["L"],
        "\U0001046E": ["R"], "\U00010465": ["M"], "\U0001046F": ["N"],
        "\U00010466": ["IH"], "\U00010470": ["IY"], "\U00010467": ["EH"],
        "\U00010471": ["EY"], "\U00010468": ["AE"], "\U00010472": ["AY"],
        "\U00010469": ["AH", "AX"],          # Ado: CMUdict writes schwa as AH0
        "\U00010473": ["AH"],                # Up  /ʌ/
        "\U0001046A": ["AH", "UH"],          # On  /ɒ/ ~ US /ʌ/
        "\U0001046B": ["UH", "AH"],          # Wool /ʊ/
        "\U00010474": ["OW"],                # Oak
        "\U00010475": ["UW"],                # Ooze
        "\U0001046C": ["AW"],                # Out
        "\U00010476": ["OY"],                # Oil
        "\U0001046D": ["AA"],                # Ah
        "\U00010477": ["AO", "AA"],          # Awe /ɔː/ (US /ɔ/, some /ɑ/)
        "\U0001047B": ["ER"],                # Err
        "\U0001047C": ["ER"],                # Array
    }
    # rhotic-vowel ligatures: rhotic American spells them vowel + R
    m["\U00010478"] = ["AA R", "ER", "AA"]                 # Are
    m["\U00010479"] = ["AO R", "ER", "AO"]                 # Or
    m["\U0001047A"] = ["EH R", "ER"]                        # Air
    m["\U0001047D"] = ["IH R", "ER"]                        # Ear
    m["\U0001047E"] = ["IY R", "ER"]                        # Ian
    m["\U0001047F"] = ["Y UW", "UW"]                        # Yew
    return {k: [s.split() for s in v] for k, v in m.items()}


# Unicode encodes only the 48 characters U+10450..U+1047F; there is no encoded
# Shavian punctuation, so the app uses ASCII punctuation + U+00B7 namer dot.
NAMER_DOT = "\u00b7"


# ------------------------------------------- phoneme -> English spelling fallback
RESPELL = [
    # (arpabet sequence, english spelling) - longest first at build time
    (["CH"], "ch"), (["SH"], "sh"), (["TH"], "th"), (["PH"], "ph"), (["ZH"], "zh"),
    (["NG"], "ng"), (["JH"], "j"), (["AA", "R"], "ar"), (["ER"], "er"),
    (["AO", "R"], "or"), (["EH", "R"], "air"), (["IH", "R"], "ear"),
    (["IY", "R"], "eer"), (["AH", "R"], "ar"), (["EY"], "ay"), (["OW"], "ow"),
    (["AW"], "ow"), (["AY"], "i"), (["OY"], "oi"), (["AH"], "u"),
    (["AA"], "a"), (["AE"], "a"), (["AO"], "aw"), (["EH"], "e"),
    (["ER"], "ur"), (["IH"], "i"), (["IY"], "ee"), (["UH"], "oo"),
    (["UW"], "oo"), (["AX"], "a"), (["AXR"], "er"), (["R"], "r"),
    (["L"], "l"), (["M"], "m"), (["N"], "n"), (["S"], "s"), (["Z"], "z"),
    (["K"], "k"), (["G"], "g"), (["P"], "p"), (["B"], "b"), (["T"], "t"),
    (["D"], "d"), (["F"], "f"), (["V"], "v"), (["W"], "w"), (["HH"], "h"),
    (["Y"], "y"),
]