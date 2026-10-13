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
-- Menyimpan data hasil import dataset komentar
-- Mapping kolom CSV (content, score, reviewed_at):
--   content       -> content
--   reviewed_at   -> waktu_comment
--   score         -> labeling
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS komentar (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  waktu_import   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content        TEXT          NOT NULL,
  waktu_comment  DATETIME      NULL,
  labeling       VARCHAR(20)   NULL,
  PRIMARY KEY (id),
  KEY idx_komentar_labeling (labeling),
  KEY idx_komentar_waktu_comment (waktu_comment)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
