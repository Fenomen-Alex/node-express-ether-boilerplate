const express = require('express');
const { sendEther } = require('../controllers/walletController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendEther);

module.exports = router;
