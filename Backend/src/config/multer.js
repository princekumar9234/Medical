const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uuidv4()}${ext}`);
  },
});

const medicineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medicines/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `medicine-${uuidv4()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: imageFilter,
});

const uploadMedicineImage = multer({
  storage: medicineStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: imageFilter,
});

module.exports = { uploadProfilePhoto, uploadMedicineImage };
