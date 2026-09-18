const { query } = require('../config/db');

/**
 * Create a new inspection
 * Fields: registration_number, vehicle_make, vehicle_model, inspection_date
 */
const createInspection = async (req, res, next) => {
  try {
    const { registration_number, vehicle_make, vehicle_model, inspection_date } = req.body;

    if (!registration_number || !vehicle_make || !vehicle_model || !inspection_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Registration Number, Vehicle Make, Vehicle Model, and Inspection Date.'
      });
    }

    const regNum = registration_number.trim().toUpperCase();
    const make = vehicle_make.trim();
    const model = vehicle_model.trim();
    const date = inspection_date;
    const userId = req.user.id;

    const result = await query(
      `INSERT INTO inspections (user_id, registration_number, vehicle_make, vehicle_model, inspection_date, status)
       VALUES (?, ?, ?, ?, ?, 'CREATED')`,
      [userId, regNum, make, model, date]
    );

    const newId = result.insertId;

    return res.status(201).json({
      success: true,
      message: 'Inspection created successfully.',
      inspectionId: newId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all inspections with defect and image counts
 */
const getInspections = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        i.id,
        i.registration_number,
        i.vehicle_make,
        i.vehicle_model,
        i.inspection_date,
        i.status,
        i.created_at,
        u.full_name AS inspector_name,
        COUNT(DISTINCT img.id) AS images_count,
        COUNT(DISTINCT d.id) AS defects_count,
        COALESCE(SUM(DISTINCT est.min_cost), 0) AS total_min_cost,
        COALESCE(SUM(DISTINCT est.max_cost), 0) AS total_max_cost
      FROM inspections i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN inspection_images img ON i.id = img.inspection_id
      LEFT JOIN defects d ON i.id = d.inspection_id
      LEFT JOIN inspection_estimates est ON i.id = est.inspection_id
      GROUP BY i.id
      ORDER BY i.id DESC
    `;

    const inspections = await query(sql);

    return res.status(200).json({
      success: true,
      inspections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed inspection by ID
 */
const getInspectionById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID.' });
    }

    const rows = await query(
      `SELECT i.*, u.full_name AS inspector_name, u.email AS inspector_email
       FROM inspections i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const inspection = rows[0];

    // Get images
    const images = await query(
      `SELECT id, inspection_id, image_path, vehicle_area, source, uploaded_at
       FROM inspection_images
       WHERE inspection_id = ?
       ORDER BY id ASC`,
      [id]
    );

    // Get defects with matching repair cost estimates if any
    const defects = await query(
      `SELECT 
        d.id, d.inspection_id, d.image_id, d.defect_type, d.component, 
        d.severity, d.confidence, d.bbox_x, d.bbox_y, d.bbox_width, d.bbox_height, d.created_at,
        est.min_cost, est.max_cost, est.cost_rule_id,
        rcm.action AS recommended_action
       FROM defects d
       LEFT JOIN inspection_estimates est ON d.id = est.defect_id
       LEFT JOIN repair_cost_master rcm ON est.cost_rule_id = rcm.id
       WHERE d.inspection_id = ?
       ORDER BY d.id ASC`,
      [id]
    );

    // Get report record if exists
    const reports = await query('SELECT * FROM reports WHERE inspection_id = ? LIMIT 1', [id]);
    const report = reports.length > 0 ? reports[0] : null;

    return res.status(200).json({
      success: true,
      inspection,
      images,
      defects,
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inspection status (e.g. IN_PROGRESS, COMPLETED)
 */
const updateInspectionStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ['CREATED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection status.' });
    }

    await query('UPDATE inspections SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      success: true,
      message: `Inspection status updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspectionStatus
};
