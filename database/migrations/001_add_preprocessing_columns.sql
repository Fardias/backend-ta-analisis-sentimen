-- ============================================================
-- Migration 001 - tambah kolom hasil preprocessing
-- Jalankan:
--   mysql -u root -p analisis_sentimen_ta < database/migrations/001_add_preprocessing_columns.sql
-- ============================================================

USE analisis_sentimen_ta;

ALTER TABLE komentar
  ADD COLUMN case_folding_result     TEXT NULL AFTER labeling,
  ADD COLUMN cleaning_result         TEXT NULL AFTER case_folding_result,
  ADD COLUMN normalisasi_result      TEXT NULL AFTER cleaning_result,
  ADD COLUMN tokenizing_result       TEXT NULL AFTER normalisasi_result,
  ADD COLUMN stopword_remove_result  TEXT NULL AFTER tokenizing_result,
  ADD COLUMN stemming_result         TEXT NULL AFTER stopword_remove_result,
  ADD COLUMN transformasi_result     JSON NULL AFTER stemming_result;
