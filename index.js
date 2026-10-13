require('dotenv').config();

const express = require('express');
const cors = require('cors');
const komentarRoutes = require('./routes/komentarRoutes');
const { successResponse, errorResponse } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  successResponse(res, { service: 'analisis-sentimen-backend' }, 'Server berjalan');
});

app.use('/api/komentar', komentarRoutes);

app.use((req, res) => {
  errorResponse(res, 'Route tidak ditemukan', 404);
});

app.use((error, req, res, next) => {
  console.error(error);
  errorResponse(res, error.message || 'Terjadi kesalahan pada server', error.statusCode || 500);
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
