const express = require('express');
const { uploadDataset } = require('../middlewares/upload');
const {
  importKomentar,
  listKomentar,
  deleteAllKomentar,
  runPreprocessing,
  runNaiveBayes
} = require('../controllers/komentarController');

const router = express.Router();

router.get('/', listKomentar);
router.post('/import', uploadDataset, importKomentar);
router.post('/preprocessing', runPreprocessing);
router.post('/naive-bayes', runNaiveBayes);
router.delete('/', deleteAllKomentar);

module.exports = router;
