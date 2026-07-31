#!/usr/bin/env python
# -*- coding: utf-8 -*-
import re
from functools import cmp_to_key

from modules.text import tables

# バージョン情報（必要なら）
__version__ = "1.0.0"

# --- ここにKUNREITAB, KUNREITAB_H, HEPBURNTAB, HEPBURNTAB_Hの定義をtables.pyから呼び出す ---
KUNREITAB = tables.KUNREITAB
KUNREITAB_H = tables.KUNREITAB_H
HEPBURNTAB = tables.HEPBURNTAB
HEPBURNTAB_H = tables.HEPBURNTAB_H


def pairs(arr, size=2):
    for i in range(0, len(arr) - 1, size):
        yield arr[i : i + size]


# Use Katakana
KANROM = {}
ROMKAN = {}

for pair in pairs(re.split(r"\s+", KUNREITAB + HEPBURNTAB)):
    kana, roma = pair
    KANROM[kana] = roma
    ROMKAN[roma] = kana

ROMKAN.update(
    {
        "du": "ヅ",
        "di": "ヂ",
        "fu": "フ",
        "ti": "チ",
        "wi": "ウィ",
        "we": "ウェ",
        "wo": "ヲ",
    }
)


def _len_cmp(x):
    return -len(x)


ROMPAT = re.compile("|".join(sorted(ROMKAN.keys(), key=_len_cmp)))


def _kanpat_cmp(x, y):
    if len(y) != len(x):
        return len(y) - len(x)
    return (len(KANROM[x]) > len(KANROM[y])) - (len(KANROM[x]) < len(KANROM[y]))


KANPAT = re.compile("|".join(sorted(KANROM.keys(), key=cmp_to_key(_kanpat_cmp))))

KUNREI = [y for (x, y) in pairs(re.split(r"\s+", KUNREITAB))]
HEPBURN = [y for (x, y) in pairs(re.split(r"\s+", HEPBURNTAB))]

KUNPAT = re.compile("|".join(sorted(KUNREI, key=_len_cmp)))
HEPPAT = re.compile("|".join(sorted(HEPBURN, key=_len_cmp)))

TO_HEPBURN = {kun: hep for kun, hep in zip(KUNREI, HEPBURN)}
TO_KUNREI = {hep: kun for kun, hep in zip(KUNREI, HEPBURN)}
TO_HEPBURN.update({"ti": "chi"})

# Use Hiragana
KANROM_H = {}
ROMKAN_H = {}

for pair in pairs(re.split(r"\s+", KUNREITAB_H + HEPBURNTAB_H)):
    kana, roma = pair
    KANROM_H[kana] = roma
    ROMKAN_H[roma] = kana

ROMKAN_H.update(
    {
        "du": "づ",
        "di": "ぢ",
        "fu": "ふ",
        "ti": "ち",
        "wi": "うぃ",
        "we": "うぇ",
        "wo": "を",
    }
)

ROMPAT_H = re.compile("|".join(sorted(ROMKAN_H.keys(), key=_len_cmp)))


def _kanpat_cmp_h(x, y):
    if len(y) != len(x):
        return len(y) - len(x)
    return (len(KANROM_H[x]) > len(KANROM_H[y])) - (len(KANROM_H[x]) < len(KANROM_H[y]))


KANPAT_H = re.compile("|".join(sorted(KANROM_H.keys(), key=cmp_to_key(_kanpat_cmp_h))))

KUNREI_H = [y for (x, y) in pairs(re.split(r"\s+", KUNREITAB_H))]
HEPBURN_H = [y for (x, y) in pairs(re.split(r"\s+", HEPBURNTAB_H))]

KUNPAT_H = re.compile("|".join(sorted(KUNREI_H, key=_len_cmp)))
HEPPAT_H = re.compile("|".join(sorted(HEPBURN_H, key=_len_cmp)))

TO_HEPBURN_H = {kun: hep for kun, hep in zip(KUNREI_H, HEPBURN_H)}
TO_KUNREI_H = {hep: kun for kun, hep in zip(KUNREI_H, HEPBURN_H)}
TO_HEPBURN_H.update({"ti": "chi"})


def normalize_double_n(s):
    s = re.sub("nn", "n'", s)
    s = re.sub("n'(?=[^aiueoyn]|$)", "n", s)
    return s


def to_katakana(s):
    s = s.lower()
    s = normalize_double_n(s)
    return ROMPAT.sub(lambda x: ROMKAN[x.group(0)], s)


def to_hiragana(s):
    s = s.lower()
    s = normalize_double_n(s)
    return ROMPAT_H.sub(lambda x: ROMKAN_H[x.group(0)], s)


def to_kana(s):
    return to_katakana(s)


def to_hepburn(s):
    tmp = s
    tmp = KANPAT.sub(lambda x: KANROM[x.group(0)], tmp)
    tmp = KANPAT_H.sub(lambda x: KANROM_H[x.group(0)], tmp)
    tmp = re.sub("n'(?=[^aeiuoyn]|$)", "n", tmp)
    if tmp == s:
        tmp = tmp.lower()
        tmp = normalize_double_n(tmp)
        tmp = KUNPAT.sub(lambda x: TO_HEPBURN[x.group(0)], tmp)
    return tmp


def to_kunrei(s):
    tmp = s
    tmp = KANPAT.sub(lambda x: KANROM[x.group(0)], tmp)
    tmp = KANPAT_H.sub(lambda x: KANROM_H[x.group(0)], tmp)
    tmp = re.sub("n'(?=[^aeiuoyn]|$)", "n", tmp)
    tmp = tmp.lower()
    tmp = normalize_double_n(tmp)
    tmp = HEPPAT.sub(lambda x: TO_KUNREI[x.group(0)], tmp)
    return tmp


def to_roma(s):
    tmp = s
    tmp = KANPAT.sub(lambda x: KANROM[x.group(0)], tmp)
    tmp = KANPAT_H.sub(lambda x: KANROM_H[x.group(0)], tmp)
    tmp = re.sub("n'(?=[^aeiuoyn]|$)", "n", tmp)
    return tmp


def is_consonant(s):
    return re.match("[ckgszjtdhfpbmyrwxn]", s.lower())


def is_vowel(s):
    return re.match("[aeiou]", s.lower())


def expand_consonant(s):
    s = s.lower()
    return sorted([mora for mora in ROMKAN.keys() if re.match("^%s.$" % s, mora)])
