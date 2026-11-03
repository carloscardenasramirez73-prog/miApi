// routes/authRoutes.js
const { Router } = require('express');
const { registrar, login } = require('../controllers/authController');

const router = Router();

router.post('/register', registrar);
router.post('/login', login);

module.exports = router;
