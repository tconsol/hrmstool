const router = require('express').Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  login, loginValidation, register, registerValidation, getMe, changePassword, updateProfile,
  verifyOTP, resendOTP, forgotPassword, resetPassword, forgotUsername,
} = require('../controllers/authController');

router.post('/register', registerValidation, validate, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/forgot-username', forgotUsername);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
