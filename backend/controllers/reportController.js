const { query } = require('../config/db');
const { assessVisualCondition } = require('../utils/conditionLogic');
const { generateInspectionPDF } = require('../services/pdfService');

/**
 * Compile all real data from MySQL for the inspection report.
 * Strictly adheres to Requirement 31: Report generated from actual MySQL data.
 */
const getReportData = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.inspectionId, 10);
    if (isNaN(inspectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID.' });
    }

    const inspections = await query(
      `SELECT i.*, u.full_name AS inspector_name, u.email AS inspector_email
       FROM inspections i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ? LIMIT 1`,
      [inspectionId]
    );

    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const inspection = inspections[0];

    // Images
    const images = await query(
      'SELECT id, image_path, vehicle_area, source, uploaded_at FROM inspection_images WHERE inspection_id = ? ORDER BY id ASC',
      [inspectionId]
    );

    // Defects with estimates
    const defects = await query(
      `SELECT 
        d.id, d.image_id, d.defect_type, d.component, d.severity, d.confidence,
        d.bbox_x, d.bbox_y, d.bbox_width, d.bbox_height,
        img.image_path, img.vehicle_area,
        est.min_cost, est.max_cost, est.cost_rule_id,
        rcm.action AS repair_action
       FROM defects d
       LEFT JOIN inspection_images img ON d.image_id = img.id
       LEFT JOIN inspection_estimates est ON d.id = est.defect_id
       LEFT JOIN repair_cost_master rcm ON est.cost_rule_id = rcm.id
       WHERE d.inspection_id = ?
       ORDER BY d.id ASC`,
      [inspectionId]
    );

    // Calculate totals
    let totalMin = 0;
    let totalMax = 0;
    defects.forEach(d => {
      if (d.min_cost !== null && d.min_cost !== undefined) {
        totalMin += parseFloat(d.min_cost);
      }
      if (d.max_cost !== null && d.max_cost !== undefined) {
        totalMax += parseFloat(d.max_cost);
      }
    });

    const condition = assessVisualCondition(defects);

    return res.status(200).json({
      success: true,
      report: {
        inspection,
        images,
        imagesCount: images.length,
        defects,
        defectsCount: defects.length,
        severityCounts: condition.severityCounts,
        totalMinCost: totalMin,
        totalMaxCost: totalMax,
        formattedRange: defects.length === 0 ? '₹0' : `₹${totalMin.toLocaleString('en-IN')} – ₹${totalMax.toLocaleString('en-IN')}`,
        conditionAssessment: condition,
        recommendedAction: 'Repair identified defects → Reinspection → Final physical verification'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream professional PDF report
 */
const downloadReportPDF = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.inspectionId, 10);
    if (isNaN(inspectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID.' });
    }

    const inspections = await query(
      `SELECT i.*, u.full_name AS inspector_name, u.email AS inspector_email
       FROM inspections i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ? LIMIT 1`,
      [inspectionId]
    );

    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const inspection = inspections[0];

    const images = await query(
      'SELECT id, image_path, vehicle_area, source, uploaded_at FROM inspection_images WHERE inspection_id = ?',
      [inspectionId]
    );

    const defects = await query(
      `SELECT 
        d.id, d.image_id, d.defect_type, d.component, d.severity, d.confidence,
        d.bbox_x, d.bbox_y, d.bbox_width, d.bbox_height,
        est.min_cost, est.max_cost,
        rcm.action AS repair_action
       FROM defects d
       LEFT JOIN inspection_estimates est ON d.id = est.defect_id
       LEFT JOIN repair_cost_master rcm ON est.cost_rule_id = rcm.id
       WHERE d.inspection_id = ?
       ORDER BY d.id ASC`,
      [inspectionId]
    );

    let totalMin = 0;
    let totalMax = 0;
    defects.forEach(d => {
      if (d.min_cost !== null && d.min_cost !== undefined) {
        totalMin += parseFloat(d.min_cost);
      }
      if (d.max_cost !== null && d.max_cost !== undefined) {
        totalMax += parseFloat(d.max_cost);
      }
    });

    const condition = assessVisualCondition(defects);

    const reportData = {
      inspection,
      imagesCount: images.length,
      defects,
      severityCounts: condition.severityCounts,
      totalMinCost: totalMin,
      totalMaxCost: totalMax,
      conditionAssessment: condition
    };

    const cleanReg = (inspection.registration_number || 'VEHICLE').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `TRUEINSPECT_Report_${cleanReg}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateInspectionPDF(reportData, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportData,
  downloadReportPDF
};
