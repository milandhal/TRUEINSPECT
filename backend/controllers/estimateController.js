const { query } = require('../config/db');
const { assessVisualCondition } = require('../utils/conditionLogic');

const COMPONENT_ALIASES = {
  'taillamp': ['Taillamp', 'Tail Lamp', 'Taillight'],
  'tail lamp': ['Taillamp', 'Tail Lamp', 'Taillight'],
  'headlamp': ['Headlamp', 'Head Lamp', 'Headlight'],
  'tire': ['Tire', 'Tyre'],
  'tyre': ['Tire', 'Tyre'],
  'boot': ['Boot', 'Tailgate'],
  'tailgate': ['Boot', 'Tailgate'],
  'bonnet': ['Bonnet', 'Hood'],
  'hood': ['Bonnet', 'Hood']
};

/**
 * Generate refurbishment cost estimate from MySQL repair_cost_master.
 * Strictly adheres to Requirement 26 & 27:
 * Zero hardcoded cost numbers in business logic.
 * Every estimate searches repair_cost_master for component, defect_type, and severity.
 * Saves applied snapshot in inspection_estimates table.
 */
const generateEstimate = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    if (isNaN(inspectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID.' });
    }

    // Verify inspection exists
    const inspections = await query('SELECT * FROM inspections WHERE id = ?', [inspectionId]);
    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    // Fetch all defects logged for this inspection
    const defects = await query('SELECT * FROM defects WHERE inspection_id = ?', [inspectionId]);

    // Clear prior estimates for this inspection to recompute
    await query('DELETE FROM inspection_estimates WHERE inspection_id = ?', [inspectionId]);

    let totalMin = 0;
    let totalMax = 0;
    const estimateBreakdown = [];

    for (const defect of defects) {
      const compKey = defect.component ? defect.component.trim().toLowerCase() : '';
      const candidates = COMPONENT_ALIASES[compKey] || [defect.component.trim()];
      const inPlaceholders = candidates.map(() => 'LOWER(?)').join(', ');

      // Lookup cost rule strictly from MySQL repair_cost_master
      const rules = await query(
        `SELECT * FROM repair_cost_master 
         WHERE LOWER(component) IN (${inPlaceholders}) 
           AND LOWER(defect_type) = LOWER(?) 
           AND LOWER(severity) = LOWER(?) 
           AND active = TRUE 
         LIMIT 1`,
        [...candidates, defect.defect_type, defect.severity]
      );

      if (rules.length > 0) {
        const rule = rules[0];
        const minC = parseFloat(rule.min_cost);
        const maxC = parseFloat(rule.max_cost);

        totalMin += minC;
        totalMax += maxC;

        // Persist estimate snapshot in inspection_estimates
        await query(
          `INSERT INTO inspection_estimates (inspection_id, defect_id, cost_rule_id, min_cost, max_cost)
           VALUES (?, ?, ?, ?, ?)`,
          [inspectionId, defect.id, rule.id, minC, maxC]
        );

        estimateBreakdown.push({
          defect_id: defect.id,
          component: defect.component,
          defect_type: defect.defect_type,
          severity: defect.severity,
          cost_rule_id: rule.id,
          action: rule.action,
          min_cost: minC,
          max_cost: maxC,
          matched: true,
          message: null
        });
      } else {
        // No matching rule found in database (Requirement 27)
        estimateBreakdown.push({
          defect_id: defect.id,
          component: defect.component,
          defect_type: defect.defect_type,
          severity: defect.severity,
          cost_rule_id: null,
          action: null,
          min_cost: null,
          max_cost: null,
          matched: false,
          message: 'Cost estimation unavailable for this defect.'
        });
      }
    }

    // Compute TRUEINSPECT Visual Condition Assessment
    const condition = assessVisualCondition(defects);

    // Save or update reports table with accurate schema columns
    const existingReports = await query('SELECT id FROM reports WHERE inspection_id = ?', [inspectionId]);
    if (existingReports.length > 0) {
      await query(
        `UPDATE reports 
         SET condition_assessment = ?, total_min_cost = ?, total_max_cost = ?
         WHERE inspection_id = ?`,
        [condition.grade, totalMin, totalMax, inspectionId]
      );
    } else {
      await query(
        `INSERT INTO reports (inspection_id, condition_assessment, total_min_cost, total_max_cost)
         VALUES (?, ?, ?, ?)`,
        [inspectionId, condition.grade, totalMin, totalMax]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Refurbishment estimate generated successfully.',
      estimate: {
        inspectionId,
        totalMinCost: totalMin,
        totalMaxCost: totalMax,
        formattedRange: defects.length === 0 ? '₹0' : `₹${totalMin.toLocaleString('en-IN')} – ₹${totalMax.toLocaleString('en-IN')}`,
        conditionAssessment: condition,
        breakdown: estimateBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current estimate for inspection
 */
const getEstimate = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    const defects = await query('SELECT * FROM defects WHERE inspection_id = ?', [inspectionId]);

    const estimates = await query(
      `SELECT est.*, rcm.action, d.component, d.defect_type, d.severity
       FROM inspection_estimates est
       LEFT JOIN repair_cost_master rcm ON est.cost_rule_id = rcm.id
       LEFT JOIN defects d ON est.defect_id = d.id
       WHERE est.inspection_id = ?`,
      [inspectionId]
    );

    let totalMin = 0;
    let totalMax = 0;
    estimates.forEach(e => {
      totalMin += parseFloat(e.min_cost || 0);
      totalMax += parseFloat(e.max_cost || 0);
    });

    const condition = assessVisualCondition(defects);

    return res.status(200).json({
      success: true,
      inspectionId,
      totalMinCost: totalMin,
      totalMaxCost: totalMax,
      formattedRange: defects.length === 0 ? '₹0' : `₹${totalMin.toLocaleString('en-IN')} – ₹${totalMax.toLocaleString('en-IN')}`,
      conditionAssessment: condition,
      estimates
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateEstimate,
  getEstimate
};
