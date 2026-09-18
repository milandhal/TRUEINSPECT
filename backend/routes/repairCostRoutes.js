const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getAllRules,
  createRule,
  updateRule,
  toggleRuleActive
} = require('../controllers/repairCostController');

router.use(authenticateToken);

// View repair cost rules (All authenticated users)
router.get('/', getAllRules);

// Management routes (Manager only)
router.post('/', requireRole('MANAGER'), createRule);
router.put('/:id', requireRole('MANAGER'), updateRule);
router.patch('/:id/toggle', requireRole('MANAGER'), toggleRuleActive);

module.exports = router;
