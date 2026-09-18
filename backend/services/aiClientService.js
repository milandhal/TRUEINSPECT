const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001/detect';

/**
 * Sends an image to the AI defect detection microservice.
 * Adheres strictly to Requirement 18:
 * Never fakes detections or confidence values.
 * If the AI model service is offline, reports service unavailable.
 *
 * @param {string} absoluteImagePath - Absolute local filesystem path to the image
 * @param {object} [options] - Optional parameters { vehicle_area, threshold }
 * @returns {Promise<{ connected: boolean, defects: Array, message?: string }>}
 */
const detectDefects = async (absoluteImagePath, options = {}) => {
  if (!fs.existsSync(absoluteImagePath)) {
    throw new Error('Image file not found on server.');
  }

  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(absoluteImagePath));
    if (options.vehicle_area) {
      formData.append('vehicle_area', options.vehicle_area);
    }
    if (options.threshold) {
      formData.append('threshold', String(options.threshold));
    }

    const response = await axios.post(AI_SERVICE_URL, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 second timeout — large images on CPU inference can take 20-45s
    });

    if (response.data && Array.isArray(response.data.defects)) {
      return {
        connected: true,
        defects: response.data.defects,
        message: response.data.defects.length > 0
          ? `${response.data.defects.length} defect(s) detected.`
          : 'No visible defects detected.'
      };
    }

    return {
      connected: true,
      defects: [],
      message: 'No visible defects detected.'
    };
  } catch (error) {
    console.warn(`[TRUEINSPECT AI Service] Notice: Could not reach AI service at ${AI_SERVICE_URL} (${error.code || error.message})`);
    return {
      connected: false,
      defects: [],
      message: 'AI detection service unavailable. Please ensure the AI detection service is running.'
    };
  }
};

module.exports = {
  detectDefects
};
