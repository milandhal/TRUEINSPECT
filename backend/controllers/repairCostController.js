const { query } = require('../config/db');

/**
 * Get all repair cost rules from MySQL repair_cost_master
 */
const getAllRules = async (req, res, next) => {
  try {
    const rules = await query(
      `SELECT * FROM repair_cost_master ORDER BY component ASC, defect_type ASC, severity ASC`
    );

    return res.status(200).json({
      success: true,
      rules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new repair cost rule (Manager only)
 */
const createRule = async (req, res, next) => {
  try {
    const { component, defect_type, severity, action, min_cost, max_cost, currency } = req.body;

    if (!component || !defect_type || !severity || !action || min_cost === undefined || max_cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: Component, Defect Type, Severity, Action, Min Cost, Max Cost.'
      });
    }

    const minC = parseFloat(min_cost);
    const maxC = parseFloat(max_cost);

    if (isNaN(minC) || isNaN(maxC) || minC < 0 || maxC < minC) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost range. Min Cost must be >= 0 and Max Cost must be >= Min Cost.'
      });
    }

    const curr = currency || 'INR';

    const result = await query(
      `INSERT INTO repair_cost_master (component, defect_type, severity, action, min_cost, max_cost, currency, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [component.trim(), defect_type.trim(), severity, action.trim(), minC, maxC, curr]
    );

    return res.status(201).json({
      success: true,
      message: 'Repair cost rule added successfully.',
      ruleId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing repair cost rule (Manager only)
 */
const updateRule = async (req, res, next) => {
  try {
    const ruleId = parseInt(req.params.id, 10);
    const { component, defect_type, severity, action, min_cost, max_cost, active } = req.body;

    const minC = parseFloat(min_cost);
    const maxC = parseFloat(max_cost);

    if (isNaN(minC) || isNaN(maxC) || minC < 0 || maxC < minC) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost range. Min Cost must be >= 0 and Max Cost must be >= Min Cost.'
      });
    }

    await query(
      `UPDATE repair_cost_master 
       SET component = ?, defect_type = ?, severity = ?, action = ?, min_cost = ?, max_cost = ?, active = ?
       WHERE id = ?`,
      [component.trim(), defect_type.trim(), severity, action.trim(), minC, maxC, active ? 1 : 0, ruleId]
    );

    return res.status(200).json({
      success: true,
      message: 'Repair cost rule updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle active status of a rule (Manager only)
 */
const toggleRuleActive = async (req, res, next) => {
  try {
    const ruleId = parseInt(req.params.id, 10);
    const existing = await query('SELECT active FROM repair_cost_master WHERE id = ?', [ruleId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cost rule not found.' });
    }

    const newActiveState = existing[0].active ? 0 : 1;
    await query('UPDATE repair_cost_master SET active = ? WHERE id = ?', [newActiveState, ruleId]);

    return res.status(200).json({
      success: true,
      message: `Cost rule ${newActiveState ? 'activated' : 'deactivated'} successfully.`,
      active: Boolean(newActiveState)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRules,
  createRule,
  updateRule,
  toggleRuleActive
};
