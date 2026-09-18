const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

/**
 * Upload one or multiple images for an inspection
 */
const uploadImages = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    if (isNaN(inspectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided.' });
    }

    // Check inspection exists
    const inspections = await query('SELECT id, status FROM inspections WHERE id = ?', [inspectionId]);
    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const { vehicle_area, source } = req.body;
    const defaultArea = vehicle_area || 'Other';
    const imageSource = (source && source.toUpperCase() === 'CAMERA') ? 'CAMERA' : 'UPLOAD';

    const savedImages = [];
    for (const file of req.files) {
      const relativePath = `/uploads/${file.filename}`;
      const result = await query(
        `INSERT INTO inspection_images (inspection_id, image_path, vehicle_area, source)
         VALUES (?, ?, ?, ?)`,
        [inspectionId, relativePath, defaultArea, imageSource]
      );

      savedImages.push({
        id: result.insertId,
        inspection_id: inspectionId,
        image_path: relativePath,
        vehicle_area: defaultArea,
        source: imageSource,
        filename: file.filename
      });
    }

    // Auto-advance status to IN_PROGRESS if currently CREATED
    if (inspections[0].status === 'CREATED') {
      await query("UPDATE inspections SET status = 'IN_PROGRESS' WHERE id = ?", [inspectionId]);
    }

    return res.status(201).json({
      success: true,
      message: `${savedImages.length} image(s) uploaded successfully.`,
      images: savedImages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all images for an inspection
 */
const getImages = async (req, res, next) => {
  try {
    const inspectionId = parseInt(req.params.id, 10);
    const images = await query(
      'SELECT * FROM inspection_images WHERE inspection_id = ? ORDER BY id ASC',
      [inspectionId]
    );

    return res.status(200).json({
      success: true,
      images
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an image
 */
const deleteImage = async (req, res, next) => {
  try {
    const imageId = parseInt(req.params.imageId, 10);
    const images = await query('SELECT * FROM inspection_images WHERE id = ?', [imageId]);
    if (images.length === 0) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    const image = images[0];
    const fullPath = path.join(__dirname, '..', image.image_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.warn('Could not delete image file:', err.message);
      }
    }

    await query('DELETE FROM inspection_images WHERE id = ?', [imageId]);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImages,
  getImages,
  deleteImage
};
