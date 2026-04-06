const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  downloadDocx,
} = require('../controllers/documentController');

router.use(auth);
router.use(authorize('hr'));

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/download', downloadDocument);
router.get('/:id/download-docx', downloadDocx);

module.exports = router;
