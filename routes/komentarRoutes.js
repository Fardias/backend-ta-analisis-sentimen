const express = require('express');
const { uploadDataset } = require('../middlewares/upload');
const { importKomentar, listKomentar } = require('../controllers/komentarController');

const router = express.Router();

router.get('/', listKomentar);
router.post('/import', uploadDataset, importKomentar);

module.exports = router;
