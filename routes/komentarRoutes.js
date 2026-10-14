const express = require('express');
const { uploadDataset } = require('../middlewares/upload');
const {
  importKomentar,
  listKomentar,
  deleteAllKomentar,
  runPreprocessing
} = require('../controllers/komentarController');

const router = express.Router();

router.get('/', listKomentar);
router.post('/import', uploadDataset, importKomentar);
router.post('/preprocessing', runPreprocessing);
router.delete('/', deleteAllKomentar);

module.exports = router;
