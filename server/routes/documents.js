const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
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
router.use(orgScope);
router.use(requireFeature('documents'));
router.use(authorize('hr', 'manager', 'ceo'));

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/download', downloadDocument);
router.get('/:id/download-docx', downloadDocx);

module.exports = router;
