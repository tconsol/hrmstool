const router = require('express').Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const validate = require('../middleware/validate');
const {
  getEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  toggleStatus,
  getDepartments,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeePersonalDetails,
  removeEmployeeDocument,
  uploadProfilePicture,
  addEmployeeValidation,
  updateEmployeeValidation,
} = require('../controllers/employeeController');

// Configure multer for memory storage with limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG, WebP files are allowed'), false);
    }
  },
});

// Configure multer for profile pictures (images only)
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pics
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP images are allowed'), false);
    }
  },
});

// Rate limit for document uploads: 30 uploads per 15 minutes per user
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many uploads. Please try again later.' },
});

// Rate limit for profile picture uploads: 5 per hour per user
const profilePictureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many profile picture uploads. Please try again later.' },
});

router.use(auth);
router.use(orgScope);

// Self-service profile picture upload - any employee can upload their own
router.post('/profile/picture', profilePictureLimiter, profilePictureUpload.single('file'), uploadProfilePicture);

router.get('/', authorize('hr', 'manager', 'ceo'), getEmployees);
router.get('/departments', authorize('hr', 'manager', 'ceo'), getDepartments);
router.get('/:id', authorize('hr', 'manager', 'ceo'), getEmployee);
router.get('/:id/documents', authorize('hr', 'manager', 'ceo'), getEmployeeDocuments);
router.post('/:id/documents/upload', authorize('hr'), uploadLimiter, upload.single('file'), uploadEmployeeDocument);
router.put('/:id/documents/personal', authorize('hr'), updateEmployeePersonalDetails);
router.delete('/:id/documents/:docKey', authorize('hr'), removeEmployeeDocument);
router.post('/', authorize('hr'), addEmployeeValidation, validate, addEmployee);
router.put('/:id', authorize('hr'), updateEmployeeValidation, validate, updateEmployee);
router.patch('/:id/toggle-status', authorize('hr'), toggleStatus);

module.exports = router;
