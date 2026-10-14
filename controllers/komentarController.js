const pool = require('../config/database');
const { parseDataset } = require('../utils/parser');
const { successResponse, errorResponse } = require('../utils/response');
const { STEPS } = require('../services/preprocessingService');

const INSERT_CHUNK_SIZE = 500;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UPDATE_CHUNK_SIZE = 200;

const LIST_COLUMNS = [
  'id',
  'waktu_import',
  'content',
  'waktu_comment',
  'labeling',
  ...Object.values(STEPS).map((step) => step.column)
].join(', ');

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

async function importKomentar(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 'File dataset wajib diunggah', 400);
    }

    const rows = parseDataset(req.file.buffer, req.file.originalname);
    if (rows.length === 0) {
      return errorResponse(res, 'Tidak ada data valid pada file (kolom content kosong)', 400);
    }

    let total = 0;
    for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
      const chunk = rows
        .slice(index, index + INSERT_CHUNK_SIZE)
        .map((row) => [row.content, row.waktu_comment, row.labeling]);

      const [result] = await pool.query(
        'INSERT INTO komentar (content, waktu_comment, labeling) VALUES ?',
        [chunk]
      );
      total += result.affectedRows;
    }

    return successResponse(res, { total }, `${total} komentar berhasil diimport`, 201);
  } catch (error) {
    next(error);
  }
}

async function listKomentar(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const offset = (page - 1) * limit;
    const keyword = (req.query.search || '').trim();

    const conditions = [];
    const params = [];
    if (keyword) {
      conditions.push('content LIKE ?');
      params.push(`%${keyword}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(`SELECT COUNT(*) AS total FROM komentar ${where}`, params);
    const total = countResult[0].total;

    const [items] = await pool.query(
      `SELECT ${LIST_COLUMNS}
       FROM komentar
       ${where}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return successResponse(res, {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    }, 'Data komentar berhasil diambil');
  } catch (error) {
    next(error);
  }
}

async function deleteAllKomentar(req, res, next) {
  try {
    const [result] = await pool.query('DELETE FROM komentar');

    return successResponse(res, { total: result.affectedRows }, `${result.affectedRows} komentar berhasil dihapus`);
  } catch (error) {
    next(error);
  }
}

async function applyStep(step) {
  const [rows] = await pool.query(
    `SELECT id, ?? AS source_value FROM komentar
     WHERE ?? IS NOT NULL AND ?? <> ''
     ORDER BY id`,
    [step.source, step.source, step.source]
  );

  if (rows.length === 0) {
    return 0;
  }

  const updates = rows.map((row) => {
    const result = step.process(row.source_value);
    return {
      id: row.id,
      value: step.returnsObject ? JSON.stringify(result) : result
    };
  });

  for (let index = 0; index < updates.length; index += UPDATE_CHUNK_SIZE) {
    const chunk = updates.slice(index, index + UPDATE_CHUNK_SIZE);
    const caseExpression = chunk.map(() => 'WHEN ? THEN ?').join(' ');
    const params = chunk.flatMap((item) => [item.id, item.value]);
    const ids = chunk.map((item) => item.id);

    await pool.query(
      `UPDATE komentar SET ?? = CASE id ${caseExpression} END WHERE id IN (?)`,
      [step.column, ...params, ids]
    );
  }

  return updates.length;
}

async function runPreprocessing(req, res, next) {
  try {
    const tahapan = [];

    for (const step of Object.values(STEPS)) {
      tahapan.push({
        label: step.label,
        kolom: step.column,
        total: await applyStep(step)
      });
    }

    const total = tahapan[0].total;
    if (total === 0) {
      return errorResponse(res, 'Belum ada data komentar untuk diproses', 400);
    }

    return successResponse(res, { total, tahapan }, `Preprocessing selesai untuk ${total} komentar`);
  } catch (error) {
    next(error);
  }
}

module.exports = { importKomentar, listKomentar, deleteAllKomentar, runPreprocessing };
