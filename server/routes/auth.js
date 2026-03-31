const router = require('express').Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { login, loginValidation, getMe, changePassword } = require('../controllers/authController');

router.post('/login', loginValidation, validate, login);
router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);

module.exports = router;
