const { query } = require('../config/db');

/**
 * Real statistics directly from MySQL database.
 * Strictly adheres to Requirement 8:
 * No hardcoded or fake statistics.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Inspections
    const totalInspRows = await query('SELECT COUNT(*) AS total FROM inspections');
    const totalInspections = totalInspRows[0].total;

    // 2. Completed Inspections
    const completedRows = await query("SELECT COUNT(*) AS completed FROM inspections WHERE status = 'COMPLETED'");
    const completedInspections = completedRows[0].completed;

    // 3. Vehicles Requiring Repair (inspections with at least 1 defect)
    const repairVehiclesRows = await query(
      'SELECT COUNT(DISTINCT inspection_id) AS requiring_repair FROM defects'
    );
    const vehiclesRequiringRepair = repairVehiclesRows[0].requiring_repair;

    // 4. Total Estimated Refurbishment range across all inspections
    const costRows = await query(
      'SELECT COALESCE(SUM(min_cost), 0) AS total_min, COALESCE(SUM(max_cost), 0) AS total_max FROM inspection_estimates'
    );
    const totalMinRefurbishment = parseFloat(costRows[0].total_min || 0);
    const totalMaxRefurbishment = parseFloat(costRows[0].total_max || 0);

    // 5. Recent Inspections list
    const recentInspections = await query(`
      SELECT 
        i.id,
        i.registration_number,
        i.vehicle_make,
        i.vehicle_model,
        i.inspection_date,
        i.status,
        i.created_at,
        u.full_name AS inspector_name,
        COUNT(DISTINCT d.id) AS defects_count,
        COALESCE(SUM(DISTINCT est.min_cost), 0) AS min_cost,
        COALESCE(SUM(DISTINCT est.max_cost), 0) AS max_cost
      FROM inspections i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN defects d ON i.id = d.inspection_id
      LEFT JOIN inspection_estimates est ON i.id = est.inspection_id
      GROUP BY i.id
      ORDER BY i.id DESC
      LIMIT 10
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalInspections,
        completedInspections,
        vehiclesRequiringRepair,
        totalMinRefurbishment,
        totalMaxRefurbishment,
        formattedTotalRefurbishment: (totalMinRefurbishment === 0 && totalMaxRefurbishment === 0)
          ? '₹0'
          : `₹${totalMinRefurbishment.toLocaleString('en-IN')} – ₹${totalMaxRefurbishment.toLocaleString('en-IN')}`
      },
      recentInspections
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
