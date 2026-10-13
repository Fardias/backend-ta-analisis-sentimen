-- ============================================================
-- DDL Database: analisis_sentimen_ta
-- Engine: MySQL (InnoDB) - charset utf8mb4 untuk dukung emoji
-- ============================================================

CREATE DATABASE IF NOT EXISTS analisis_sentimen_ta
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE analisis_sentimen_ta;

-- ------------------------------------------------------------
-- Tabel: komentar
-- Menyimpan data hasil import dataset + hasil preprocessing
--
-- Mapping kolom dataset (content, score, reviewed_at):
--   content       -> content
--   reviewed_at   -> waktu_comment
--   score         -> labeling
--
-- Kolom hasil preprocessing (diisi bertahap oleh proses NLP):
--   case_folding_result     : teks diubah ke huruf kecil
--   cleaning_result         : URL, angka, tanda baca, emoji dihapus
--   tokenizing_result       : daftar token, dipisah koma
--   normalisasi_result      : token setelah normalisasi, dipisah koma
--   stopword_remove_result  : token tanpa stopword, dipisah koma
--   stemming_result         : token setelah stemming, dipisah koma
--   transformasi_result     : Bag of Words, JSON {"kata": frekuensi}
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS komentar (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  waktu_import            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content                 TEXT          NOT NULL,
  waktu_comment           DATETIME      NULL,
  labeling                VARCHAR(20)   NULL,
  case_folding_result     TEXT          NULL,
  cleaning_result         TEXT          NULL,
  tokenizing_result       TEXT          NULL,
  normalisasi_result      TEXT          NULL,
  stopword_remove_result  TEXT          NULL,
  stemming_result         TEXT          NULL,
  transformasi_result     JSON          NULL,
  PRIMARY KEY (id),
  KEY idx_komentar_labeling (labeling),
  KEY idx_komentar_waktu_comment (waktu_comment)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
