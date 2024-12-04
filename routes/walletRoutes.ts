import express from 'express';
import { sendEther } from '../controllers/walletController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/send', protect, sendEther);

export default router;
