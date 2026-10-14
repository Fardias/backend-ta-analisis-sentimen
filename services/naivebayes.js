/**
 * Naive Bayes (Multinomial) — implementasi from scratch tanpa library ML.
 *
 * Digunakan untuk klasifikasi sentimen dari fitur Bag of Words
 * (hasil tahap transformasi). Model memakai Multinomial Naive Bayes
 * dengan Laplace smoothing (alpha = 1).
 *
 * Format dokumen yang diterima:
 *   { label: 'positif', features: { 'bagus': 1, 'aplikasi': 2 } }
 * `features` adalah Bag of Words: kata -> frekuensi.
 *
 * Alur lengkap:
 *   A. Menghitung prior probability  -> computePriors()
 *   B. Membangun vocabulary          -> buildVocabulary()
 *   C. Menghitung likelihood         -> computeLikelihoods()
 *   D. Training (gabung A+B+C)       -> trainNaiveBayes()
 *   E. Prediksi kelas                -> predictClass()
 *   F. Evaluasi model                -> evaluate() + computeMetrics()
 */

/**
 * LANGKAH A — Menghitung Prior Probability
 *
 * P(kelas) = jumlah dokumen kelas tersebut / total dokumen.
 * Menjawab pertanyaan: "seberapa sering kelas ini muncul di data training?"
 * Tanpa melihat kata-katanya sama sekali.
 */
function computePriors(documents) {
  let positif_label_total = 0;
  let negatif_label_total = 0;

  for (const doc of documents) {
    if (doc.label === 'positif') {
      positif_label_total += 1;
    } else if (doc.label === 'negatif') {
      negatif_label_total += 1;
    }
  }

  const total = documents.length;

  const priors = {
    positif: positif_label_total / total,
    negatif: negatif_label_total / total
  };

  console.log(priors);
  return priors;
}

/**
 * LANGKAH B — Membangun Vocabulary
 *
 * Kumpulan semua kata unik yang muncul pada data training.
 * Vocabulary dipakai agar tiap dokumen direpresentasikan dengan
 * ruang fitur yang sama, dan hanya dibangun dari data training
 * (supaya tidak bocor dari data testing).
 */
function buildVocabulary(documents) {
  const vocabulary = new Set();

  for (const doc of documents) {
    for (const term in doc.features) {
      vocabulary.add(term);
    }
  }

  return [...vocabulary];
}

/**
 * LANGKAH C — Menghitung Likelihood
 *
 * P(kata | kelas) dengan Laplace smoothing:
 *
 *   P(kata|kelas) = (frekuensi kata pada kelas + alpha)
 *                 / (total kata pada kelas + alpha * ukuran_vocabulary)
 *
 * alpha = 1 (Laplace smoothing) supaya kata yang tidak pernah muncul
 * pada suatu kelas tidak menghasilkan probabilitas nol.
 */
function computeLikelihoods(documents, vocabulary, alpha = 1) {
  // Tempat menyimpan frekuensi tiap kata untuk tiap kelas.
  const positifTermCounts = {};
  const negatifTermCounts = {};

  // Total seluruh frekuensi kata pada tiap kelas.
  let positifTotal = 0;
  let negatifTotal = 0;

  // Langkah 1: hitung frekuensi kata di tiap kelas.
  for (const doc of documents) {
    const features = doc.features || {};

    for (const term in features) {
      const frequency = features[term];

      if (doc.label === 'positif') {
        if (positifTermCounts[term] === undefined) {
          positifTermCounts[term] = frequency;
        } else {
          positifTermCounts[term] += frequency;
        }
        positifTotal += frequency;
      } else if (doc.label === 'negatif') {
        if (negatifTermCounts[term] === undefined) {
          negatifTermCounts[term] = frequency;
        } else {
          negatifTermCounts[term] += frequency;
        }
        negatifTotal += frequency;
      }
    }
  }

  const vocabularySize = vocabulary.length;

  // Langkah 2: hitung likelihood tiap kata dengan Laplace smoothing.
  const positifLikelihood = {};
  const negatifLikelihood = {};

  for (const term of vocabulary) {
    const positifCount = positifTermCounts[term] || 0;
    const negatifCount = negatifTermCounts[term] || 0;

    positifLikelihood[term] = (positifCount + alpha) / (positifTotal + alpha * vocabularySize);
    negatifLikelihood[term] = (negatifCount + alpha) / (negatifTotal + alpha * vocabularySize);
  }

  return {
    positif: positifLikelihood,
    negatif: negatifLikelihood
  };
}

/**
 * LANGKAH D — Training Model
 *
 * Menggabungkan prior (A), vocabulary (B), dan likelihood (C)
 * menjadi satu objek model yang siap dipakai untuk prediksi.
 */
function trainNaiveBayes(documents, alpha = 1) {
  const priors = computePriors(documents);
  const vocabulary = buildVocabulary(documents);
  const likelihoods = computeLikelihoods(documents, vocabulary, alpha);

  return {
    classes: Object.keys(priors),
    priors,
    vocabulary,
    likelihoods,
    alpha
  };
}

/**
 * LANGKAH E — Prediksi Kelas
 *
 * Menggunakan log-probability agar tidak underflow saat dikalikan:
 *
 *   skor(kelas) = log P(kelas) + SUM( frekuensi_kata * log P(kata|kelas) )
 *
 * Kata yang tidak ada di vocabulary training diabaikan.
 * Kelas dengan skor tertinggi menjadi hasil prediksi.
 */
function predictClass(model, document) {
  const scores = {};

  for (const label of model.classes) {
    let score = Math.log(model.priors[label]);

    for (const [term, frequency] of Object.entries(document.features || {})) {
      const likelihood = model.likelihoods[label][term];
      if (likelihood !== undefined) {
        score += frequency * Math.log(likelihood);
      }
    }

    scores[label] = score;
  }

  let bestLabel = model.classes[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const label of model.classes) {
    if (scores[label] > bestScore) {
      bestScore = scores[label];
      bestLabel = label;
    }
  }

  return bestLabel;
}

/**
 * LANGKAH F — Evaluasi Model
 *
 * Memprediksi seluruh data testing lalu membandingkan dengan label asli.
 */
function evaluate(model, documents) {
  const labels = documents.map((doc) => doc.label);
  const predictions = documents.map((doc) => predictClass(model, doc));

  // Kelas dievaluasi adalah gabungan kelas training + testing.
  const classes = [...new Set([...model.classes, ...labels])];

  return computeMetrics(labels, predictions, classes);
}

/**
 * Menghitung confusion matrix, accuracy, precision, recall, dan F1.
 *
 * - Accuracy  : (TP + TN) / total
 * - Precision : TP / (TP + FP)   -> dari semua yang diprediksi X, berapa yang benar
 * - Recall    : TP / (TP + FN)   -> dari semua yang sebenarnya X, berapa yang terprediksi
 * - F1        : rata-rata harmonik precision & recall = 2PR / (P + R)
 *
 * `support` adalah jumlah data asli pada kelas tersebut.
 */
function computeMetrics(labels, predictions, classes) {
  // Confusion matrix: matrix[kelas_aktual][kelas_prediksi] = jumlah.
  const matrix = {};
  for (const actual of classes) {
    matrix[actual] = {};
    for (const predicted of classes) {
      matrix[actual][predicted] = 0;
    }
  }

  let correct = 0;
  for (let index = 0; index < labels.length; index += 1) {
    const actual = labels[index];
    const predicted = predictions[index];
    matrix[actual][predicted] += 1;
    if (actual === predicted) correct += 1;
  }

  const total = labels.length;
  const accuracy = total > 0 ? correct / total : 0;

  // Perhitungan per kelas.
  const perClass = {};
  for (const cls of classes) {
    const tp = matrix[cls][cls];
    let fp = 0;
    let fn = 0;

    for (const other of classes) {
      if (other !== cls) {
        fp += matrix[other][cls]; // diprediksi cls, padahal other
        fn += matrix[cls][other]; // sebenarnya cls, diprediksi other
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    perClass[cls] = { precision, recall, f1, support: tp + fn };
  }

  // Macro average: rata-rata metrik semua kelas tanpa memperhatikan proporsi.
  const count = classes.length;
  const sum = (metric) => classes.reduce((totalMetric, cls) => totalMetric + perClass[cls][metric], 0);

  const macro = {
    precision: count > 0 ? sum('precision') / count : 0,
    recall: count > 0 ? sum('recall') / count : 0,
    f1: count > 0 ? sum('f1') / count : 0
  };

  return { accuracy, confusionMatrix: matrix, perClass, macro, total };
}

module.exports = {
  computePriors,
  buildVocabulary,
  computeLikelihoods,
  trainNaiveBayes,
  predictClass,
  evaluate,
  computeMetrics
};
