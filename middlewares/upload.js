const path = require('path');
const multer = require('multer');

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      const error = new Error(`Format file harus salah satu dari: ${ALLOWED_EXTENSIONS.join(', ')}`);
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  }
});

function uploadDataset(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      error.message = 'Ukuran file terlalu besar (maksimal 10MB)';
    }
    error.statusCode = error.statusCode || 400;
    next(error);
  });
}

module.exports = { uploadDataset };
