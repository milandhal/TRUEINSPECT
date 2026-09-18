const errorHandler = (err, req, res, next) => {
  console.error('TRUEINSPECT Error:', err);

  // Multer error handling
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed. File size exceeds maximum limit of 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Image upload failed: ${err.message}`
    });
  }

  // Custom filter error
  if (err.message && err.message.includes('Invalid image format')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // MySQL specific errors sanitized for user safety
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Email already registered.'
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please check MySQL server status and configuration.'
    });
  }

  // General server error
  const statusCode = err.statusCode || 500;
  const userMessage = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message: userMessage
  });
};

module.exports = errorHandler;
