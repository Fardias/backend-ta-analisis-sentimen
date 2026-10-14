const fs = require('fs');
const path = require('path');
const { Stemmer } = require('sastrawijs');
const normalisasiDictionary = require('../data/normalisasi.json');

const stemmer = new Stemmer();

const STOPWORDS_PATH = path.join(__dirname, '..', 'data', 'stopwords.txt');
const stopwordSet = new Set(
  fs
    .readFileSync(STOPWORDS_PATH, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.startsWith('#'))
);

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/g;
const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;
const MENTION_HASHTAG_PATTERN = /[@#]/g;
const NON_LETTER_PATTERN = /[^\p{L}\s]/gu;
const WHITESPACE_PATTERN = /\s+/g;
const LAUGHTER_PATTERN = /^(?:w*k|h[aei]|x[di]){2,}$/;

// Sejak tahap tokenizing, nilai kolom disimpan sebagai daftar token
// dengan pemisah koma supaya batas antar token terlihat jelas.
// Saat membaca, spasi juga diterima sebagai pemisah agar data lama
// (yang masih dipisah spasi) tidak rusak.
const TOKEN_SEPARATOR = ', ';
const TOKEN_SPLIT_PATTERN = /[\s,]+/;

// Memecah kalimat menjadi kata.
function words(text) {
  return text.split(WHITESPACE_PATTERN).filter(Boolean);
}

// Membaca kembali kolom yang sudah berisi daftar token.
function tokens(text) {
  return text.split(TOKEN_SPLIT_PATTERN).filter(Boolean);
}

function joinTokens(list) {
  return list.join(TOKEN_SEPARATOR);
}

function caseFolding(text) {
  return text.toLowerCase();
}

function cleaning(text) {
  return text
    .replace(URL_PATTERN, ' ')
    .replace(EMOJI_PATTERN, ' ')
    .replace(MENTION_HASHTAG_PATTERN, ' ')
    .replace(NON_LETTER_PATTERN, ' ')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();
}

function tokenizing(text) {
  return joinTokens(words(text));
}

function normalisasi(text) {
  return joinTokens(
    tokens(text).flatMap((token) => {
      if (Object.prototype.hasOwnProperty.call(normalisasiDictionary, token)) {
        return words(normalisasiDictionary[token]);
      }
      return LAUGHTER_PATTERN.test(token) ? [] : [token];
    })
  );
}

function stopwordRemove(text) {
  return joinTokens(tokens(text).filter((token) => !stopwordSet.has(token)));
}

function stemming(text) {
  return joinTokens(tokens(text).map((token) => stemmer.stem(token)));
}

function transformasi(text) {
  return tokens(text).reduce((bagOfWords, token) => {
    bagOfWords[token] = (bagOfWords[token] || 0) + 1;
    return bagOfWords;
  }, {});
}

// Pembagian data training/testing (80:20) secara stratified per label,
// dengan seed tetap agar hasilnya reproducible.
const SPLIT_RATIO = 0.8;
const SPLIT_SEED = 42;

function seededShuffle(array) {
  let state = SPLIT_SEED;

  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const shuffled = array.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

// rows: array berisi { id, labeling }.
function splitTrainTest(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.labeling ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row.id);
  }

  const trainingIds = [];
  const testingIds = [];

  for (const ids of groups.values()) {
    const shuffled = seededShuffle(ids);
    const cut = Math.round(ids.length * SPLIT_RATIO);
    trainingIds.push(...shuffled.slice(0, cut));
    testingIds.push(...shuffled.slice(cut));
  }

  return { trainingIds, testingIds };
}

// Urutan tahap preprocessing. Setiap tahap membaca kolom `source`
// dan menulis hasilnya ke kolom `column`.
const STEPS = {
  'case-folding': {
    label: 'Case Folding',
    column: 'case_folding_result',
    source: 'content',
    process: caseFolding,
    returnsObject: false
  },
  cleaning: {
    label: 'Cleaning',
    column: 'cleaning_result',
    source: 'case_folding_result',
    process: cleaning,
    returnsObject: false
  },
  tokenizing: {
    label: 'Tokenizing',
    column: 'tokenizing_result',
    source: 'cleaning_result',
    process: tokenizing,
    returnsObject: false
  },
  normalisasi: {
    label: 'Normalisasi',
    column: 'normalisasi_result',
    source: 'tokenizing_result',
    process: normalisasi,
    returnsObject: false
  },
  'stopword-remove': {
    label: 'Stopword Remove',
    column: 'stopword_remove_result',
    source: 'normalisasi_result',
    process: stopwordRemove,
    returnsObject: false
  },
  stemming: {
    label: 'Stemming',
    column: 'stemming_result',
    source: 'stopword_remove_result',
    process: stemming,
    returnsObject: false
  },
  'split-data': {
    label: 'Split Data',
    column: 'data_split',
    source: 'stemming_result',
    kind: 'split'
  },
  transformasi: {
    label: 'Transformasi',
    column: 'transformasi_result',
    source: 'stemming_result',
    process: transformasi,
    returnsObject: true
  }
};

const RESULT_COLUMNS = Object.values(STEPS).map((step) => step.column);

module.exports = {
  STEPS,
  RESULT_COLUMNS,
  splitTrainTest,
  caseFolding,
  cleaning,
  tokenizing,
  normalisasi,
  stopwordRemove,
  stemming,
  transformasi
};
