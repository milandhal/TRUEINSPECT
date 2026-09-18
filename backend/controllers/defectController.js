const path = require('path');
const { query } = require('../config/db');
const { detectDefects } = require('../services/aiClientService');

/**
 * Trigger AI defect detection on an uploaded inspection image.
 * Never fakes detections, confidence or bounding boxes.
 */
const runAIDetection = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    const { image_id } = req.body;

    if (!image_id) {
      return res.status(400).json({ success: false, message: 'Please specify an image_id for AI analysis.' });
    }

    // Retrieve image record
    const images = await query(
      'SELECT * FROM inspection_images WHERE id = ? AND inspection_id = ? LIMIT 1',
      [image_id, inspectionId]
    );

    if (images.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection image not found.' });
    }

    const img = images[0];
    const cleanRelPath = img.image_path.startsWith('/') ? img.image_path.slice(1) : img.image_path;
    const absoluteImagePath = path.join(__dirname, '..', cleanRelPath);

    // Call standalone AI service
    const aiResult = await detectDefects(absoluteImagePath, {
      vehicle_area: img.vehicle_area
    });

    if (!aiResult.connected) {
      return res.status(503).json({
        success: false,
        aiServiceAvailable: false,
        message: aiResult.message || 'AI detection service unavailable.'
      });
    }

    // Clear any previous AI-detected defects for this image before saving refreshed detections
    await query(
      'DELETE FROM defects WHERE inspection_id = ? AND image_id = ? AND confidence IS NOT NULL',
      [inspectionId, image_id]
    );

    // Save detected defects if any
    const savedDefects = [];
    if (aiResult.defects && aiResult.defects.length > 0) {
      for (const d of aiResult.defects) {
        const component = d.component || 'General Body';
        const defectType = d.defectType || 'Dent';
        const severity = d.severity || 'Minor';
        const confidence = (typeof d.confidence === 'number') ? d.confidence : null;
        const bbox = d.boundingBox || {};

        const result = await query(
          `INSERT INTO defects 
           (inspection_id, image_id, defect_type, component, severity, confidence, bbox_x, bbox_y, bbox_width, bbox_height)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inspectionId,
            image_id,
            defectType,
            component,
            severity,
            confidence,
            bbox.x ?? null,
            bbox.y ?? null,
            bbox.width ?? null,
            bbox.height ?? null
          ]
        );

        savedDefects.push({
          id: result.insertId,
          inspection_id: inspectionId,
          image_id,
          defect_type: defectType,
          component,
          severity,
          confidence,
          bbox_x: bbox.x ?? null,
          bbox_y: bbox.y ?? null,
          bbox_width: bbox.width ?? null,
          bbox_height: bbox.height ?? null
        });
      }
    }

    return res.status(200).json({
      success: true,
      aiServiceAvailable: true,
      message: aiResult.message,
      defects: savedDefects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inspector manual defect logging
 * Leaves confidence NULL (Requirement 24)
 */
const addManualDefect = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    const { image_id, defect_type, component, severity } = req.body;

    if (!defect_type || !component || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide defect_type, component, and severity (Minor, Moderate, Major).'
      });
    }

    const validSeverities = ['Minor', 'Moderate', 'Major'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severity must be Minor, Moderate, or Major.'
      });
    }

    const result = await query(
      `INSERT INTO defects 
       (inspection_id, image_id, defect_type, component, severity, confidence)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [inspectionId, image_id || null, defect_type.trim(), component.trim(), severity]
    );

    return res.status(201).json({
      success: true,
      message: 'Defect recorded successfully.',
      defectId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all defects for an inspection
 */
const getDefects = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    const defects = await query(
      `SELECT d.*, img.image_path, img.vehicle_area 
       FROM defects d
       LEFT JOIN inspection_images img ON d.image_id = img.id
       WHERE d.inspection_id = ?
       ORDER BY d.id ASC`,
      [inspectionId]
    );

    return res.status(200).json({
      success: true,
      defects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a defect
 */
const deleteDefect = async (req, res, next) => {
  try {
    const defectId = parseInt(req.params.defectId, 10);
    await query('DELETE FROM defects WHERE id = ?', [defectId]);

    return res.status(200).json({
      success: true,
      message: 'Defect removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runAIDetection,
  addManualDefect,
  getDefects,
  deleteDefect
};
