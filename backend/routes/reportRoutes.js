const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getReportData, downloadReportPDF } = require('../controllers/reportController');

router.use(authenticateToken);

router.get('/:inspectionId', getReportData);
router.get('/:inspectionId/pdf', downloadReportPDF);

module.exports = router;
