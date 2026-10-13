const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

// Pemetaan kolom sumber (file dataset) -> kolom tabel komentar
const SOURCE_COLUMNS = {
  content: 'content',
  waktu_comment: 'reviewed_at',
  labeling: 'score'
};

const CSV_EXTENSION = '.csv';

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function toDateTimeString(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return formatDate(value);

  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
  if (match) {
    const time = match[2] ? (match[2].length === 5 ? `${match[2]}:00` : match[2]) : '00:00:00';
    return `${match[1]} ${time}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : formatDate(parsed);
}

function normalizeRow(row) {
  const content = String(row[SOURCE_COLUMNS.content] ?? '').trim();
  if (!content) return null;

  const label = row[SOURCE_COLUMNS.labeling];
  const labeling = label === null || label === undefined || label === '' ? null : String(label).trim();

  return {
    content,
    waktu_comment: toDateTimeString(row[SOURCE_COLUMNS.waktu_comment]),
    labeling
  };
}

function parseCsv(buffer) {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true
  });
}

function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File spreadsheet tidak memiliki sheet');

  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: true });
}

function parseDataset(buffer, filename) {
  const extension = path.extname(filename).toLowerCase();
  const rawRows = extension === CSV_EXTENSION ? parseCsv(buffer) : parseSpreadsheet(buffer);
  return rawRows.map(normalizeRow).filter((row) => row !== null);
}

module.exports = { parseDataset, toDateTimeString };
