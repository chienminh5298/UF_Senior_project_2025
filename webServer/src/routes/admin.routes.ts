import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';
import { Status } from '@prisma/client';

const router = Router();

// GET  /api/admin/users
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin user page)
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
 *                           id:
 *                             type: integer
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch users
 */
router.get('/users', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
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

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: { users },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

/**UNFINISHED**/
// GET /api/admin/users/:id # Get specific user
router.get('/users/:id', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID not found' });
  }

  const user_specific = await prisma.user.findUnique({
    where: { id: parseInt(id) },
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

  if (!user_specific) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: { user_specific },
  });
});

// GET  /api/admin/landing   # Landing page data

// GET  /api/admin/orders    # List orders (History)
/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (admin history page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Filter by order status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVE, FINISHED, EXPIRED]
 *           example: FINISHED
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:         { type: integer }
 *                           orderId:    { type: string }
 *                           status:     { type: string, enum: [ACTIVE, FINISHED, EXPIRED] }
 *                           side:       { type: string, enum: [BUY, SELL] }
 *                           token:
 *                             type: object
 *                             properties:
 *                               name: { type: string }
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:    { type: integer }
 *                               email: { type: string }
 *                           entryPrice: { type: number }
 *                           fee:        { type: number }
 *                           qty:        { type: number }
 *                           budget:     { type: number }
 *                           netProfit:  { type: number }
 *                           buyDate:    { type: string, format: date-time }
 *                           sellDate:   { type: string, format: date-time, nullable: true }
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch orders }
 */
router.get('/orders', requireAuth, async (req, res) => {
  const { user } = req;
  const status = req.query.status as Status | undefined;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { status: status as Status },
      orderBy: { buyDate: 'desc' },
      select: {
        id: true,
        orderId: true,
        status: true,
        side: true,
        entryPrice: true,
        fee: true,
        qty: true,
        budget: true,
        netProfit: true,
        buyDate: true,
        token: { select: { name: true } },
        user: { select: { id: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: { orders },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});

// GET /api/admin/orders/stats
/**
 * @swagger
 * /api/admin/orders/stats:
 *   get:
 *     summary: Get stats of orders (Admin history page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTrades: { type: integer }
 *                     completedTrades: { type: integer }
 *                     pendingTrades: { type: integer }
 *                     cancelledTrades: { type: integer }
 *                     totalProfit: { type: number }
 *                     avgProfit: { type: number }
 */
router.get('/orders/stats', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [
      totalTrades,
      completedTrades,
      pendingTrades,
      cancelledTrades,
      sums,
      averageProfit,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: Status.FINISHED } }),
      prisma.order.count({ where: { status: Status.ACTIVE } }),
      prisma.order.count({ where: { status: Status.EXPIRED } }),
      prisma.order.aggregate({
        _sum: {
          netProfit: true,
        },
      }),
      prisma.order.aggregate({
        _avg: {
          netProfit: true,
        },
      }),
    ]);

    const totalProfit = sums._sum.netProfit;
    const avgProfit = averageProfit._avg.netProfit;

    return res.status(200).json({
      success: true,
      message: 'Stats fetched successfully',
      data: {
        totalTrades,
        completedTrades,
        pendingTrades,
        cancelledTrades,
        totalProfit,
        avgProfit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
    });
  }
});

// GET /api/admin/orders/:id # Get specific order

// GET  /api/admin/bills     # List bills

export default router;
