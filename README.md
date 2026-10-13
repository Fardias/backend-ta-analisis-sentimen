# Backend - Analisis Sentimen

REST API untuk import dan menampilkan dataset komentar. Express + MySQL.

## Struktur

```
config/       koneksi database (mysql2 pool)
controllers/  logika endpoint (komentarController.js)
middlewares/  upload file (multer)
routes/       definisi route
utils/        helper (response format, parser csv/xlsx)
database/     DDL (analisis_sentimen_ta.sql)
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
3. Copy `.env.example` menjadi `.env`, lalu sesuaikan kredensial MySQL.
4. Jalankan
   ```bash
   npm run dev     # mode watch
   npm start
   ```

## Endpoint

| Method | Path                     | Keterangan                                   |
| ------ | ------------------------ | -------------------------------------------- |
| GET    | `/health`                | Cek status server                            |
| POST   | `/api/komentar/import`   | Upload dataset (multipart, field `file`)     |
| GET    | `/api/komentar`          | List komentar (`page`, `limit`, `search`)    |

Format file yang diterima: `.csv`, `.xlsx`, `.xls` (maksimal 10MB).

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
