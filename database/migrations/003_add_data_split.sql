-- ============================================================
-- Migration 003 - tambah kolom data_split (penanda training/testing)
-- Dipakai untuk membagi dataset 80:20 sebelum transformasi.
-- Nilai: 'training' | 'testing'.
--
-- Jalankan:
--   mysql -u root -p analisis_sentimen_ta < database/migrations/003_add_data_split.sql
-- ============================================================

USE analisis_sentimen_ta;

ALTER TABLE komentar
  ADD COLUMN data_split VARCHAR(20) NULL AFTER stemming_result;
