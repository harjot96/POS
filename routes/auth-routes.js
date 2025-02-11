const express = require('express')
const { registerUser, loginUser, deleteUser } = require('../controllers/auth-controller');
const authMiddleWare = require('../helper/auth-middleware');
const router = express.Router();

router.post('/register', registerUser)
router.post('/login', loginUser)
router.delete('/deleteUser', authMiddleWare, deleteUser)

module.exports = router