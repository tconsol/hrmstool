const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateStatus,
  deleteInvoice,
  downloadPDF,
  getSummary,
} = require('../controllers/invoiceController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('invoices'));

// Only manager and ceo can access invoices
router.use(authorize('manager', 'ceo'));

router.get('/',              getInvoices);
router.get('/summary',       getSummary);
router.get('/:id',           getInvoice);
router.get('/:id/pdf',       downloadPDF);
router.post('/',             createInvoice);
router.put('/:id',           updateInvoice);
router.patch('/:id/status',  updateStatus);
router.delete('/:id',        deleteInvoice);

module.exports = router;
