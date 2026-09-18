const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(authenticateToken);

router.get('/', getDashboardStats);

module.exports = router;
