const express = require('express');
const { sendOtp, verifyOtp, registerUser, checkUserDetails } = require('../controllers/auth-controller');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerUser);

module.exports = router;
