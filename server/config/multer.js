const multer = require('multer');

// Multer is the middleware that receives uploaded files from the frontend.
// We use memory storage — the file is held in RAM temporarily,
// never written to disk. Once we're done reading it, it's gone.
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  // Only allow CSV files.
  // If someone tries to upload a PDF or image here, reject it.
  fileFilter: (req, file, callback) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv');

    if (!isCsv) {
      return callback(new Error('Only CSV files are allowed'));
    }

    callback(null, true);
  },

  // Maximum file size — 5MB.
  // A CSV with 10,000 rows is usually well under 1MB, so 5MB is generous.
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
