import { Router } from 'express';

import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import backtestRoutes from './backtest.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/backtest', backtestRoutes);
router.use('/public', publicRoutes);

export default router;
