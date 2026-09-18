const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspectionStatus
} = require('../controllers/inspectionController');

const {
  uploadImages,
  getImages,
  deleteImage
} = require('../controllers/imageController');

const {
  runAIDetection,
  addManualDefect,
  getDefects,
  deleteDefect
} = require('../controllers/defectController');

const {
  generateEstimate,
  getEstimate
} = require('../controllers/estimateController');

// All inspection routes require authentication
router.use(authenticateToken);

// Core Inspection endpoints
router.post('/', createInspection);
router.get('/', getInspections);
router.get('/:id', getInspectionById);
router.patch('/:id/status', updateInspectionStatus);

// Images endpoints (multi-image upload supported)
router.post('/:id/images', upload.array('images', 15), uploadImages);
router.get('/:id/images', getImages);
router.delete('/:id/images/:imageId', deleteImage);

// Defects endpoints
router.post('/:id/defects', addManualDefect);
router.post('/:id/defects/ai-detect', runAIDetection);
router.get('/:id/defects', getDefects);
router.delete('/:id/defects/:defectId', deleteDefect);

// Estimation endpoints
router.post('/:id/estimate', generateEstimate);
router.get('/:id/estimate', getEstimate);

module.exports = router;
