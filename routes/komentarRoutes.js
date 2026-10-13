const express = require('express');
const { uploadDataset } = require('../middlewares/upload');
const {
  importKomentar,
  listKomentar,
  deleteAllKomentar,
  getProgress,
  processStep
} = require('../controllers/komentarController');

const router = express.Router();

router.get('/', listKomentar);
router.get('/progress', getProgress);
router.post('/import', uploadDataset, importKomentar);
router.post('/proses/:step', processStep);
router.delete('/', deleteAllKomentar);

module.exports = router;
