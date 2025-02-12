const express = require('express')
const { registerUser, loginUser, deleteUser } = require('../controllers/auth-controller');
const authMiddleWare = require('../middleware/authentication');
const authorizationMiddleware = require('../middleware/authorization')
const router = express.Router();

router.post('/register', registerUser)
router.post('/login', loginUser)
router.delete('/deleteUser/:id', authMiddleWare, authorizationMiddleware(['admin']), deleteUser)

module.exports = router