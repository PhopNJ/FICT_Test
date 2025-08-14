// router
const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const detailController = require('../controllers/detailController');
const filterController = require('../controllers/filterController');
const multer = require('multer');  // <-- This must come first
const upload = multer();    

// Form routes
router.get('/form', formController.renderForm);
router.post('/submit', formController.submitForm);

// Detail routes
router.get('/detail', detailController.renderDetail);
router.delete('/delete/:id', detailController.deleteLand);

// Filter routes
router.get('/filter', filterController.renderFilter);
router.get('/filter-data', filterController.getFilterData);

router.post('/export-data', filterController.exportData);
// New route for import
router.post('/import-data', upload.single('file'), filterController.importData);

module.exports = router;