# Backend - Analisis Sentimen

REST API untuk import dan menampilkan dataset komentar. Express + MySQL.

## Struktur

```
config/       koneksi database (mysql2 pool)
controllers/  logika endpoint (komentarController.js)
data/         kamus normalisasi + daftar stopword
middlewares/  upload file (multer)
routes/       definisi route
services/     logika preprocessing NLP
utils/        helper (response format, parser csv/xlsx)
database/     DDL + migration
index.js      entry point
```

## Setup

1. Install dependency
   ```bash
   npm install
   ```
2. Buat database + tabel
   ```bash
   mysql -u root -p < database/analisis_sentimen_ta.sql
   ```
   Kalau database sudah pernah dibuat sebelumnya, jalankan migration yang
   belum diterapkan (urut):
   ```bash
   mysql -u root -p < database/migrations/001_add_preprocessing_columns.sql
   mysql -u root -p < database/migrations/002_reorder_tokenizing_column.sql
   ```
3. Copy `.env.example` menjadi `.env`, lalu sesuaikan kredensial MySQL.
4. Jalankan
   ```bash
   npm run dev     # mode watch
   npm start
   ```

## Endpoint

| Method | Path                          | Keterangan                                   |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/health`                     | Cek status server                            |
| POST   | `/api/komentar/import`        | Upload dataset (multipart, field `file`)     |
| GET    | `/api/komentar`               | List komentar (`page`, `limit`, `search`)    |
| POST   | `/api/komentar/preprocessing` | Jalankan semua tahap preprocessing           |
| DELETE | `/api/komentar`               | Hapus semua komentar                         |

Format file yang diterima: `.csv`, `.xlsx`, `.xls` (maksimal 10MB).

## Pipeline preprocessing

Tahap dijalankan berurutan dalam satu kali proses. Setiap tahap membaca kolom
sebelumnya dan menulis hasilnya ke kolomnya sendiri, jadi kolom awal memang
kosong.

| Kolom hasil              | Sumber                   | Proses                                   |
| ------------------------ | ------------------------ | ---------------------------------------- |
| `case_folding_result`    | `content`                | huruf kecil                              |
| `cleaning_result`        | `case_folding_result`    | hapus URL, angka, tanda baca, emoji      |
| `tokenizing_result`      | `cleaning_result`        | pecah jadi token, dipisah koma           |
| `normalisasi_result`     | `tokenizing_result`      | kata tidak baku jadi baku                |
| `stopword_remove_result` | `normalisasi_result`     | buang stopword                           |
| `stemming_result`        | `stopword_remove_result` | kata dasar (Sastrawi)                    |
| `transformasi_result`    | `stemming_result`        | Bag of Words `{"kata": frekuensi}`       |

- Stemming memakai `sastrawijs` (port JavaScript dari Sastrawi).
- Kamus normalisasi: `data/normalisasi.json` (bebas ditambah/dikoreksi).
- Stopword: `data/stopwords.txt` (bawaan Sastrawi, bebas diedit).
- Kolom token disimpan sebagai teks dengan pemisah koma.
- Endpoint preprocessing menolak jika tabel belum berisi data.

Kalau mau mengubah urutan atau menambah tahap, cukup ubah objek `STEPS` di
`services/preprocessingService.js`.

## Pemetaan kolom dataset

Kolom tabel `komentar` diisi dari header file dataset (`utils/parser.js`):

| Kolom tabel     | Header file |
| --------------- | ----------- |
| `content`       | `content`   |
| `waktu_comment` | `reviewed_at` |
| `labeling`      | `score`     |

Baris tanpa `content` akan dilewati. Kalau format dataset berubah, cukup ubah
objek `SOURCE_COLUMNS` di `utils/parser.js`.

## Format response

Semua endpoint memakai format seragam dari `utils/response.js`:

```json
{
  "responseStatus": true,
  "responseMessage": "Data komentar berhasil diambil",
  "responseData": {}
}
```
