import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET  /api/admin/users
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get admin users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fullname:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           isVerified:
 *                             type: boolean
 *                           isActive:
 *                             type: boolean
 *                           avatar:
 *                             type: number
 *                           tradeBalance:
 *                             type: number
 *                           adminCommissionPercent:
 *                             type: number
 *                           referralCommissionPercent:
 *                             type: number
 *                           profit:
 *                             type: number
 */
router.get('/users', requireAuth, async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        fullname: true,
        username: true,
        email: true,
        isVerified: true,
        isActive: true,
        avatar: true,
        tradeBalance: true,
        adminCommissionPercent: true,
        referralCommissionPercent: true,
        profit: true,
      },
    });
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: { users },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully',
    data: { users: [] },
  });
});

// GET  /api/admin/landing   # Landing page data

// GET  /api/admin/orders    # List orders (History)
/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get admin orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                           buyDate:
 *                             type: string
 *                           sellDate:
 *                             type: string
 *                           token:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                           side:
 *                             type: string
 *                           budget:
 *                             type: number
 *                           qty:
 *                             type: number
 *                           strategyId:
 *                             type: number
 *                           netProfit:
 *                             type: number
 *                           entryPrice:
 *                             type: number
 */
router.get('/orders', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const orders = await prisma.order.findMany({
      select: {
        orderId: true,
        buyDate: true,
        sellDate: true,
        token: {
          select: {
            name: true,
          },
        },
        side: true,
        budget: true,
        qty: true,
        strategyId: true,
        netProfit: true,
        entryPrice: true,
      },
    });
    res
      .status(200)
      .json({
        success: true,
        message: 'Orders fetched successfully',
        data: { orders },
      });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/admin/orders/:id # Get specific order
// GET  /api/admin/bills     # List bills

export default router;
