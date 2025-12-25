/**
 * File Upload Middleware
 * 
 * Handles file uploads for education content and report evidence files.
 * Supports images, videos, and PDFs with a 10MB size limit.
 * Files are stored in backend/uploads/education/ or backend/uploads/reports/.
 * 
 * @module middleware/uploadMiddleware
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const educationUploadsDir = path.join(__dirname, '../../uploads/education');
const reportsUploadsDir = path.join(__dirname, '../../uploads/reports');

if (!fs.existsSync(educationUploadsDir)) {
  fs.mkdirSync(educationUploadsDir, { recursive: true });
}
if (!fs.existsSync(reportsUploadsDir)) {
  fs.mkdirSync(reportsUploadsDir, { recursive: true });
}

/**
 * Configure multer disk storage for education content
 * Generates unique filenames to prevent conflicts
 */
const educationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, educationUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure multer disk storage for report evidence files
 * Generates unique filenames to prevent conflicts
 */
const reportsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportsUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter - only allow images, videos, PDFs
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'), false);
  }
};

/**
 * Configure multer with storage, limits, and file filter for education
 */
const educationUpload = multer({
  storage: educationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

/**
 * Configure multer with storage, limits, and file filter for reports
 */
const reportsUpload = multer({
  storage: reportsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

module.exports = {
  upload: educationUpload.single('media_file'),
  uploadMultiple: educationUpload.array('media_files', 5), // For multiple files if needed
  uploadEvidenceFiles: reportsUpload.array('evidence_files', 5) // For report evidence (up to 5 files)
};
