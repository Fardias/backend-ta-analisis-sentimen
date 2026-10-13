-- ============================================================
-- Migration 002 - pindahkan tokenizing_result ke setelah cleaning_result
-- Urutan tahap jadi: cleaning -> tokenizing -> normalisasi -> ...
-- Tidak mengubah data, hanya urutan kolom.
--
-- Jalankan:
--   mysql -u root -p analisis_sentimen_ta < database/migrations/002_reorder_tokenizing_column.sql
-- ============================================================

USE analisis_sentimen_ta;

ALTER TABLE komentar
  MODIFY COLUMN tokenizing_result TEXT NULL AFTER cleaning_result;
