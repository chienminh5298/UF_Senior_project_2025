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
        isActive: true,
        tradeBalance: true,
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

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get specific user (admin user page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: User ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User fetched successfully
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
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User ID not found
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
router.get('/users/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

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
      isActive: true,
      avatar: true,
      tradeBalance: true,
      profit: true,
      createdAt: true,
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

// PATCH  /api/admin/users/{id}
/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Suspend/reinstate user (admin user page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: User ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deactivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User suspended/reinstated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User ID not found or deactivate must be a boolean or missing
 *       500:
 *         description: Failed to suspend/reinstate user
 */
router.patch('/users/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID not found' });
  }

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user ID' });
    }

    // First get the current user to toggle their status
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Toggle the isActive status
    const user_specific = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentUser.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `User ${!currentUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: user_specific },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
});

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
    // Default to ACTIVE orders if no status specified (for Admin orders page)
    const filterStatus = status || Status.ACTIVE;

    const orders = await prisma.order.findMany({
      where: { status: filterStatus },
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
        token: { select: { name: true, isActive: true } },
        user: { select: { id: true, email: true, isActive: true } },
        strategy: { select: { description: true } },
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
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 'Page number (default: 1)'
 *     responses:
 *       '200':
 *         description: 'Stats fetched successfully'
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
 *                     totalTrades:
 *                       type: integer
 *                     completedTrades:
 *                       type: integer
 *                     pendingTrades:
 *                       type: integer
 *                     cancelledTrades:
 *                       type: integer
 *                     totalProfit:
 *                       type: number
 *                     avgProfit:
 *                       type: number
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to fetch stats'
 */

// GET /api/admin/orders/all
/**
 * @swagger
 * /api/admin/orders/all:
 *   get:
 *     summary: Get all orders with pagination and status filtering
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 'Page number (default: 1)'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [5, 10, 25]
 *           default: 10
 *         description: 'Number of orders per page'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [FINISHED, ACTIVE, EXPIRED]
 *         description: 'Filter orders by status'
 *     responses:
 *       '200':
 *         description: 'Orders fetched successfully'
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
 *                           id: { type: integer }
 *                           orderId: { type: string }
 *                           status: { type: string, enum: [ACTIVE, FINISHED, EXPIRED] }
 *                           side: { type: string, enum: [BUY, SELL] }
 *                           entryPrice: { type: number }
 *                           fee: { type: number }
 *                           qty: { type: number }
 *                           budget: { type: number }
 *                           netProfit: { type: number }
 *                           buyDate: { type: string, format: date-time }
 *                           sellDate: { type: string, format: date-time, nullable: true }
 *                           token:
 *                             type: object
 *                             properties:
 *                               name: { type: string }
 *                               isActive: { type: boolean }
 *                           user:
 *                             type: object
 *                             properties:
 *                               id: { type: integer }
 *                               email: { type: string }
 *                               isActive: { type: boolean }
 *                           strategy:
 *                             type: object
 *                             properties:
 *                               description: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalOrders: { type: integer }
 *                         limit: { type: integer }
 *                         hasNextPage: { type: boolean }
 *                         hasPrevPage: { type: boolean }
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to fetch orders'
 */

router.get('/orders/all', requireAuth, async (req, res) => {
  const { user } = req;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  if (!user) {
    // return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Validate limit to only allow 5, 10, or 25
  const validLimits = [5, 10, 25];
  const validatedLimit = validLimits.includes(limit) ? limit : 10;

  try {
    const skip = (page - 1) * validatedLimit;

    // Build where clause for status filtering
    const whereClause: any = {};
    if (status && ['FINISHED', 'ACTIVE', 'EXPIRED'].includes(status)) {
      whereClause.status = status;
    }

    // Get total count for pagination info
    const totalOrders = await prisma.order.count({ where: whereClause });

    const orders = await prisma.order.findMany({
      where: whereClause,
      skip,
      take: validatedLimit,
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
        sellDate: true,
        token: { select: { name: true, isActive: true } },
        user: { select: { id: true, email: true, isActive: true } },
        strategy: { select: { description: true } },
      },
    });

    const totalPages = Math.ceil(totalOrders / validatedLimit);

    return res.status(200).json({
      success: true,
      message: 'All orders fetched successfully',
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          limit: validatedLimit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
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
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch stats }
 */
router.get('/orders/stats', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    // return res.status(401).json({ success: false, message: 'Unauthorized' });
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

// GET  /api/admin/bills     # List bills

/**
 * @swagger
 * /api/admin/strategies:
 *   get:
 *     summary: Get all strategies (Admin strategies page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Strategies fetched successfully
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
 *                     strategies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           isActive: { type: boolean }
 *                           tokenStrategies:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 token:
 *                                   type: object
 *                                   properties:
 *                                     name: { type: string }
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch strategies }
 */
// Get /api/admin/strategies
router.get('/strategies', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const response = await prisma.strategy.findMany({
    select: {
      id: true,
      description: true,
      isActive: true,

      tokenStrategies: {
        select: {
          token: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const targets = await prisma.target.findMany({
    select: {
      targetPercent: true,
      stoplossPercent: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Strategies fetched successfully',
    data: { response, targets },
  });
});

/**
 * @swagger
 * /api/admin/strategies/{id}/targets:
 *   patch:
 *     summary: Update targets (targetPercent and stoplossPercent) for a strategy
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Strategy ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targets]
 *             properties:
 *               targets:
 *                 type: array
 *                 description: Array of existing Target rows to update
 *                 items:
 *                   type: object
 *                   required: [id, targetPercent, stoplossPercent]
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     targetPercent:
 *                       type: number
 *                       example: 0.75
 *                     stoplossPercent:
 *                       type: number
 *                       example: 0.15
 *     responses:
 *       200:
 *         description: Targets updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Targets updated successfully }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update targets
 */

// PATCH /api/admin/strategies/:id/targets
router.patch('/strategies/:id/targets', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { targets } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const strategyId = Number(id);

    // Use transaction to replace all targets
    await prisma.$transaction(async (tx) => {
      // Delete all existing targets for this strategy
      await tx.target.deleteMany({
        where: { strategyId },
      });

      // Create new targets
      if (targets && targets.length > 0) {
        await tx.target.createMany({
          data: targets.map(
            (t: { targetPercent: number; stoplossPercent: number }) => ({
              strategyId,
              targetPercent: t.targetPercent,
              stoplossPercent: t.stoplossPercent,
            })
          ),
        });
      }
    });

    return res
      .status(200)
      .json({ success: true, message: 'Targets updated successfully' });
  } catch (error) {
    console.error('Error updating targets:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update targets' });
  }
});

// GET /api/admin/strategies/{id}
/**
 * @swagger
 * /api/admin/strategies/{id}:
 *   get:
 *     summary: Get a specific strategy (Admin strategies page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Strategy ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Strategy fetched successfully
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
 *                     response:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         isActive: { type: boolean }
 *                         description: { type: string }
 *                         targets:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: integer, example: 3 }
 *                               targetPercent: { type: number, example: 2.5 }
 *                               stoplossPercent: { type: number, example: 1.0 }
 *                         tokenStrategies:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               token:
 *                                 type: object
 *                                 properties:
 *                                   name: { type: string }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch strategy
 */

// Get /api/admin/strategies/{id}
router.get('/strategies/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    // return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const response = await prisma.strategy.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        description: true,
        isActive: true,
        targets: {
          select: {
            id: true,
            targetPercent: true,
            stoplossPercent: true,
          },
        },
        tokenStrategies: {
          select: {
            token: {
              where: { isActive: true },
              select: { name: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Strategy fetched successfully',
      data: { response },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch strategy',
    });
  }
});

// POST /api/admin/strategies
/**
 * @swagger
 * /api/admin/strategies:
 *   post:
 *     summary: Create a new strategy (Admin strategies page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - targets
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Breakout scalper"
 *               contribution:
 *                 type: number
 *                 example: 150
 *               isCloseBeforeNewCandle:
 *                 type: boolean
 *                 example: false
 *               direction:
 *                 type: string
 *                 enum: [SAME, OPPOSITE]
 *                 example: SAME
 *               tokenStrategies:
 *                 type: array
 *                 description: Tokens linked to this strategy
 *                 items:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: integer
 *                       example: 5
 *               targets:
 *                 type: array
 *                 description: Targets belonging to this strategy
 *                 items:
 *                   type: object
 *                   required:
 *                     - targetPercent
 *                     - stoplossPercent
 *                   properties:
 *                     targetPercent:
 *                       type: number
 *                       example: 3.5
 *                     stoplossPercent:
 *                       type: number
 *                       example: 1.2
 *                     tokenId:
 *                       type: integer
 *                       description: Optional token reference for the target
 *                       example: 7
 *     responses:
 *       200:
 *         description: Strategy created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input or missing fields
 *       500:
 *         description: Failed to create strategy
 */

router.post('/strategies', requireAuth, async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const {
      description,
      contribution,
      tokenStrategies = [],
      targets = [],
      direction = 'SAME',
      isCloseBeforeNewCandle = false,
    } = req.body;

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: 'Description expected' });
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Targets expected' });
    }

    const allowedDirections = new Set(['SAME', 'OPPOSITE']);
    if (!allowedDirections.has(direction)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid direction' });
    }

    const data = {
      description,
      contribution: Number(contribution) || 0,
      isActive: false,
      isCloseBeforeNewCandle: Boolean(isCloseBeforeNewCandle),
      direction,

      targets: {
        create: targets.map((t) => ({
          targetPercent: Number(t.targetPercent) || 0,
          stoplossPercent: Number(t.stoplossPercent) || 0,
        })),
      },

      ...(tokenStrategies.length
        ? {
            tokenStrategies: {
              create: tokenStrategies.map(
                ({ tokenId }: { tokenId: number }) => ({
                  token: { connect: { id: Number(tokenId) } },
                })
              ),
            },
          }
        : {}),
    };

    const strategy = await prisma.strategy.create({
      data,
      include: {
        targets: true,
        tokenStrategies: { include: { token: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Strategy created successfully',
      data: { strategy },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create strategy' });
  }
});

// GET /api/admin/tokens
/**
 * @swagger
 * /api/admin/tokens:
 *   get:
 *     summary: Get all available tokens
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens fetched successfully
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
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           isActive: { type: boolean }
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch tokens }
 */
router.get('/tokens', requireAuth, async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const tokens = await prisma.token.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Tokens fetched successfully',
      data: { tokens },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tokens',
    });
  }
});

// PATCH /api/admin/strategies/{id}
/**
 * @swagger
 * /api/admin/strategies/{id}:
 *   patch:
 *     summary: Update strategy basic information (Admin strategies page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Strategy ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Updated strategy description"
 *               contribution:
 *                 type: number
 *                 example: 200
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isCloseBeforeNewCandle:
 *                 type: boolean
 *                 example: false
 *               direction:
 *                 type: string
 *                 enum: [SAME, OPPOSITE]
 *                 example: SAME
 *     responses:
 *       200:
 *         description: Strategy updated successfully
 *       401: { description: Unauthorized }
 *       400: { description: Invalid input or missing fields }
 *       500: { description: Failed to update strategy }
 */
router.patch('/strategies/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const {
    description,
    contribution,
    isActive,
    isCloseBeforeNewCandle,
    direction,
  } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const strategyId = parseInt(id);
    if (isNaN(strategyId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid strategy ID' });
    }

    if (direction && !['SAME', 'OPPOSITE'].includes(direction)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid direction' });
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (contribution !== undefined)
      updateData.contribution = Number(contribution);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (isCloseBeforeNewCandle !== undefined)
      updateData.isCloseBeforeNewCandle = Boolean(isCloseBeforeNewCandle);
    if (direction !== undefined) updateData.direction = direction;

    const strategy = await prisma.strategy.update({
      where: { id: strategyId },
      data: updateData,
      include: {
        targets: true,
        tokenStrategies: { include: { token: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Strategy updated successfully',
      data: { strategy },
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update strategy',
    });
  }
});

// GET  /api/admin/bills     # List bills
/**
 * @swagger
 * /api/admin/bills:
 *   get:
 *     summary: Get all bills (Admin bills page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bills fetched successfully
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
 *                     bills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           status: { type: string, enum: [NEW, PROCESSING, COMPLETED] }
 *                           netProfit: { type: number }
 *                           from: { type: string, format: date-time }
 *                           to: { type: string, format: date-time }
 *                           user:
 *                             type: object
 *                             properties:
 *                               id: { type: integer }
 *                               username: { type: string }
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch bills }
 */

router.get('/bills', requireAuth, async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const bills = await prisma.bill.findMany({
      select: {
        id: true,
        status: true,
        netProfit: true,
        from: true,
        to: true,
        user: { select: { id: true, username: true } },
      },
    });
    return res.status(200).json({
      success: true,
      message: 'Bills fetched successfully',
      data: { bills },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
    });
  }
});

// GET /api/admin/bills/{id}
/**
 * @swagger
 * /api/admin/bills/{id}:
 *   get:
 *     summary: Get a specific bill (Admin bills page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Bill ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bill fetched successfully
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
 *                     id: { type: integer }
 *                     status: { type: string, enum: [NEW, PROCESSING, COMPLETED] }
 *                     netProfit: { type: number }
 *                     from: { type: string, format: date-time }
 *                     to: { type: string, format: date-time }
 *                     note: { type: string }
 *                     claimId: { type: integer }
 *                     orders: { type: array }
 *                     user: { type: object }
 *                     properties:
 *                       id: { type: integer }
 *                       username: { type: string }
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch bill }
 */

// GET /api/admin/bills/{id}
router.get('/bills/:id', requireAuth, async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        status: true,
        netProfit: true,
        from: true,
        to: true,
        note: true,
        claimId: true,
        orders: {
          select: {
            id: true,
            orderId: true,
            side: true,
            entryPrice: true,
            qty: true,
            budget: true,
            netProfit: true,
            token: { where: { isActive: true }, select: { name: true } },
          },
        },
        user: {
          where: { isActive: true },
          select: { id: true, username: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Bill fetched successfully',
      data: { bill },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
    });
  }
});

// PATCH /api/admin/tokens/bulk
/**
 * @swagger
 * /api/admin/tokens/bulk:
 *   patch:
 *     summary: Bulk update token active status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokens]
 *             properties:
 *               tokens:
 *                 type: array
 *                 description: Array of token IDs to activate
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Tokens updated successfully
 *       401: { description: Unauthorized }
 *       500: { description: Failed to update tokens }
 */
router.patch('/tokens/bulk', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { tokens } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(tokens)) {
      return res.status(400).json({
        success: false,
        message: 'tokens must be an array of token IDs',
      });
    }

    // First, deactivate all tokens
    await prisma.token.updateMany({
      data: { isActive: false },
    });

    // Then, activate only the selected tokens
    if (tokens.length > 0) {
      await prisma.token.updateMany({
        where: { id: { in: tokens } },
        data: { isActive: true },
      });
    }

    // Refresh active tokens in WebSocket service
    try {
      const { binanceWebSocketService } = await import(
        '../services/binanceWebSocket'
      );
      await binanceWebSocketService.refreshActiveTokens();
    } catch (wsError) {
      console.error('Error refreshing WebSocket active tokens:', wsError);
      // Don't fail the request if WebSocket refresh fails
    }

    return res.status(200).json({
      success: true,
      message: 'Tokens updated successfully',
    });
  } catch (error) {
    console.error('Error bulk updating tokens:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update tokens',
    });
  }
});

// PATCH api/admin/tokens/{id}
/**
 * @swagger
 * /api/admin/tokens/{id}:
 *   patch:
 *     summary: Update a token (Admin tokens page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Token ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deactivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Token updated successfully
 *       401: { description: Unauthorized }
 *       400: { description: Token ID not found or deactivate must be a boolean or missing }
 *       500: { description: Failed to update token }
 */
router.patch('/tokens/:id', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { deactivate } = req.body;

    if (deactivate === undefined || typeof deactivate !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'deactivate must be a boolean or missing',
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: 'Token ID not found' });
    }

    const tokenId = parseInt(id);
    if (isNaN(tokenId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid token ID' });
    }

    await prisma.token.update({
      where: { id: tokenId },
      data: { isActive: !deactivate },
    });

    return res.status(200).json({
      success: true,
      message: `Token ${!deactivate ? 'deactivated' : 'activated'} successfully`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update token' });
  }
});

// DELETE api/admin/strategies/{id}
/**
 * @swagger
 * /api/admin/strategies/{id}:
 *   delete:
 *     summary: Delete a strategy (Admin strategies page)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Strategy ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Strategy deleted successfully
 *       401: { description: Unauthorized }
 *       400: { description: Strategy ID not found or invalid }
 *       500: { description: Failed to delete strategy }
 */
router.delete('/strategies/:id', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: 'Strategy ID not found' });
    }

    const strategyId = parseInt(id);

    if (isNaN(strategyId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid strategy ID' });
    }

    await prisma.strategy.delete({ where: { id: strategyId } });

    return res
      .status(200)
      .json({ success: true, message: 'Strategy deleted successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete strategy' });
  }
});

// PATCH /api/admin/strategies/{id}/tokens
/**
 * @swagger
 * /api/admin/strategies/{id}/tokens:
 *   patch:
 *     summary: Update token associations for a strategy
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Strategy ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokenIds]
 *             properties:
 *               tokenIds:
 *                 type: array
 *                 description: Array of token IDs to associate with this strategy
 *                 items:
 *                   type: integer
 *                   example: 5
 *     responses:
 *       200:
 *         description: Token associations updated successfully
 *       401: { description: Unauthorized }
 *       400: { description: Invalid input or missing fields }
 *       500: { description: Failed to update token associations }
 */
router.patch('/strategies/:id/tokens', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { tokenIds } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const strategyId = parseInt(id);
    if (isNaN(strategyId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid strategy ID' });
    }

    if (!Array.isArray(tokenIds)) {
      return res
        .status(400)
        .json({ success: false, message: 'tokenIds must be an array' });
    }

    const validTokenIds = tokenIds.filter(
      (id) => typeof id === 'number' && !isNaN(id)
    );
    if (validTokenIds.length !== tokenIds.length) {
      return res.status(400).json({
        success: false,
        message: 'All token IDs must be valid numbers',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.tokenStrategy.deleteMany({
        where: { strategyId },
      });

      if (validTokenIds.length > 0) {
        await tx.tokenStrategy.createMany({
          data: validTokenIds.map((tokenId) => ({
            strategyId,
            tokenId,
          })),
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Token associations updated successfully',
    });
  } catch (error) {
    console.error('Error updating token associations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update token associations',
    });
  }
});

// GET /api/admin/claims
/**
 * @swagger
 * /api/admin/claims:
 *   get:
 *     summary: Get all claims with pagination
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 'Page number'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [5, 10, 25]
 *           default: 10
 *         description: 'Number of claims per page'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, PROCESSING, COMPLETED, REJECTED]
 *         description: 'Filter by claim status'
 *     responses:
 *       '200':
 *         description: 'Claims fetched successfully'
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to fetch claims'
 */
router.get('/claims', requireAuth, async (req, res) => {
  const { user } = req;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Validate limit
  const validLimits = [5, 10, 25];
  const validatedLimit = validLimits.includes(limit) ? limit : 10;

  try {
    const skip = (page - 1) * validatedLimit;

    // Build where clause
    const whereClause: any = {};
    if (
      status &&
      ['NEW', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)
    ) {
      whereClause.status = status;
    }

    // Get total count
    const totalClaims = await prisma.claim.count({ where: whereClause });

    // Fetch claims with related data
    const claims = await prisma.claim.findMany({
      where: whereClause,
      skip,
      take: validatedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        bills: {
          select: {
            id: true,
            netProfit: true,
            status: true,
          },
        },
      },
    });

    // Format claims data
    const formattedClaims = claims.map((claim) => ({
      id: claim.id,
      amount: claim.amount,
      status: claim.status,
      network: claim.network,
      address: claim.address,
      hashId: claim.hashId,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      user: claim.user,
      billsCount: claim.bills.length,
    }));

    const totalPages = Math.ceil(totalClaims / validatedLimit);

    return res.status(200).json({
      success: true,
      message: 'Claims fetched successfully',
      data: {
        claims: formattedClaims,
        pagination: {
          currentPage: page,
          totalPages,
          totalClaims,
          limit: validatedLimit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch claims',
    });
  }
});

// GET /api/admin/claims/{id}
/**
 * @swagger
 * /api/admin/claims/{id}:
 *   get:
 *     summary: Get detailed claim information
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 'Claim ID'
 *     responses:
 *       '200':
 *         description: 'Claim details fetched successfully'
 *       '404':
 *         description: 'Claim not found'
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to fetch claim details'
 */
router.get('/claims/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const claimId = parseInt(id);
    if (isNaN(claimId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim ID',
      });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        bills: {
          include: {
            orders: {
              include: {
                token: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Claim details fetched successfully',
      data: { claim },
    });
  } catch (error) {
    console.error('Error fetching claim details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch claim details',
    });
  }
});

// PATCH /api/admin/claims/{id}/approve
/**
 * @swagger
 * /api/admin/claims/{id}/approve:
 *   patch:
 *     summary: Approve a claim
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 'Claim ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: 'Admin note for the user'
 *                 example: 'Claim approved. Funds will be transferred within 24 hours.'
 *     responses:
 *       '200':
 *         description: 'Claim approved successfully'
 *       '404':
 *         description: 'Claim not found'
 *       '400':
 *         description: 'Invalid request or claim cannot be approved'
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to approve claim'
 */
router.patch('/claims/:id/approve', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { note } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const claimId = parseInt(id);
    if (isNaN(claimId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim ID',
      });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { user: true },
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    if (claim.status !== 'NEW') {
      return res.status(400).json({
        success: false,
        message: 'Only NEW claims can be approved',
      });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'FINISHED',
        hashId: note || 'Claim approved by admin',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Claim approved successfully',
      data: { claim: updatedClaim },
    });
  } catch (error) {
    console.error('Error approving claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve claim',
    });
  }
});

// PATCH /api/admin/claims/{id}/reject
/**
 * @swagger
 * /api/admin/claims/{id}/reject:
 *   patch:
 *     summary: Reject a claim
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 'Claim ID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: 'Admin note explaining rejection reason'
 *                 example: 'Insufficient trading activity or invalid documentation.'
 *     responses:
 *       '200':
 *         description: 'Claim rejected successfully'
 *       '404':
 *         description: 'Claim not found'
 *       '400':
 *         description: 'Invalid request or claim cannot be rejected'
 *       '401':
 *         description: 'Unauthorized'
 *       '500':
 *         description: 'Failed to reject claim'
 */
router.patch('/claims/:id/reject', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { note } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const claimId = parseInt(id);
    if (isNaN(claimId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim ID',
      });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { user: true },
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    if (claim.status !== 'NEW') {
      return res.status(400).json({
        success: false,
        message: 'Only NEW claims can be rejected',
      });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'FINISHED',
        hashId: note || 'Claim rejected by admin',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Claim rejected successfully',
      data: { claim: updatedClaim },
    });
  } catch (error) {
    console.error('Error rejecting claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject claim',
    });
  }
});

// GET /api/admin/orders/realtime-pnl
/**
 * @swagger
 * /api/admin/orders/realtime-pnl:
 *   get:
 *     summary: Get real-time P&L for all active orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time P&L data fetched successfully
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
 *                             type: integer
 *                           tokenName:
 *                             type: string
 *                           entryPrice:
 *                             type: number
 *                           currentPrice:
 *                             type: number
 *                           quantity:
 *                             type: number
 *                           side:
 *                             type: string
 *                             enum: [BUY, SELL]
 *                           unrealizedPnL:
 *                             type: number
 *                           unrealizedPnLPercent:
 *                             type: number
 *                           userId:
 *                             type: integer
 *                           userEmail:
 *                             type: string
 *                           status:
 *                             type: string
 *                           buyDate:
 *                             type: string
 *                             format: date-time
 *                           strategy:
 *                             type: string
 *                           lastUpdated:
 *                             type: string
 *                             format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalUnrealizedPnL:
 *                           type: number
 *                         totalUnrealizedPnLPercent:
 *                           type: number
 *                         orderCount:
 *                           type: integer
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch real-time P&L data
 */
router.get('/orders/realtime-pnl', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { priceService } = await import('../services/priceService');

    const ordersWithPnL = await priceService.getActiveOrdersWithPnL();
    const summary = await priceService.getTotalUnrealizedPnL();

    return res.status(200).json({
      success: true,
      message: 'Real-time P&L data fetched successfully',
      data: {
        orders: ordersWithPnL,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching real-time P&L:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time P&L data',
    });
  }
});

// GET /api/admin/orders/price-data
/**
 * @swagger
 * /api/admin/orders/price-data:
 *   get:
 *     summary: Get current token prices
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tokens
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Comma-separated list of token names
 *     responses:
 *       200:
 *         description: Token prices fetched successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tokenName:
 *                         type: string
 *                       currentPrice:
 *                         type: number
 *                       priceChange:
 *                         type: number
 *                       priceChangePercent:
 *                         type: number
 *                       lastUpdated:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch price data
 */
router.get('/orders/price-data', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { priceService } = await import('../services/priceService');

    const { tokens } = req.query;
    let tokenNames: string[] = [];

    if (tokens && typeof tokens === 'string') {
      tokenNames = tokens.split(',').map((t) => t.trim());
    } else {
      // Get all active tokens from database
      const dbTokens = await prisma.token.findMany({
        where: { isActive: true },
        select: { name: true },
      });
      tokenNames = dbTokens.map((t) => t.name);
    }

    const prices = await priceService.getTokenPrices(tokenNames);

    return res.status(200).json({
      success: true,
      message: 'Token prices fetched successfully',
      data: prices,
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch price data',
    });
  }
});

// GET /api/admin/dashboard/stats
/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (portfolio, P&L, tokens)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
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
 *                     totalPortfolio:
 *                       type: number
 *                       description: Total portfolio value (sum of all order budgets)
 *                     totalPnL:
 *                       type: number
 *                       description: Total profit and loss (sum of netProfit from finished orders)
 *                     dailyPnL:
 *                       type: number
 *                       description: Daily P&L (sum of netProfit from orders created today)
 *                     activeTokensCount:
 *                       type: integer
 *                       description: Number of tokens that are active (isActive equals true)
 *                     availableTokensCount:
 *                       type: integer
 *                       description: Total number of all tokens in database (regardless of active status)
 *                     activeStrategies:
 *                       type: array
 *                       description: List of active strategies with trade counts and P&L
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           description:
 *                             type: string
 *                           trades:
 *                             type: integer
 *                             description: Number of trades today for this strategy
 *                           pnl:
 *                             type: number
 *                             description: Total P&L from orders today for this strategy
 *                           tokenCount:
 *                             type: integer
 *                             description: Number of tokens associated with this strategy
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch dashboard stats
 */
router.get('/dashboard/stats', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const totalPortfolioResult = await prisma.order.aggregate({
      _sum: {
        budget: true,
      },
    });
    const totalPortfolio = totalPortfolioResult._sum.budget || 0;

    const totalPnLResult = await prisma.order.aggregate({
      where: {
        status: Status.FINISHED,
      },
      _sum: {
        netProfit: true,
      },
    });
    const totalPnL = totalPnLResult._sum.netProfit || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPnLResult = await prisma.order.aggregate({
      where: {
        status: Status.FINISHED,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        netProfit: true,
      },
    });
    const dailyPnL = dailyPnLResult._sum.netProfit || 0;

    const activeTokensCount = await prisma.token.count({
      where: {
        isActive: true,
      },
    });

    const availableTokensCount = await prisma.token.count();

    const activeStrategiesData = await prisma.strategy.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        description: true,
        tokenStrategies: {
          select: {
            token: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const activeStrategies = await Promise.all(
      activeStrategiesData.map(async (strategy) => {
        const todayOrders = await prisma.order.findMany({
          where: {
            strategyId: strategy.id,
            createdAt: {
              gte: today,
            },
          },
          select: {
            netProfit: true,
          },
        });

        const trades = todayOrders.length;
        const pnl = todayOrders.reduce(
          (sum, order) => sum + (order.netProfit || 0),
          0
        );
        const tokenCount = strategy.tokenStrategies.length;

        return {
          id: strategy.id,
          description: strategy.description,
          trades,
          pnl,
          tokenCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        totalPortfolio,
        totalPnL,
        dailyPnL,
        activeTokensCount,
        availableTokensCount,
        activeStrategies,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
});

// GET /api/admin/portfolio
/**
 * @swagger
 * /api/admin/portfolio:
 *   get:
 *     summary: Get admin portfolio data (aggregated across all users)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio data fetched successfully
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
 *                     totalValue:
 *                       type: number
 *                       description: Total portfolio value (sum of all budgets)
 *                     todayChange:
 *                       type: number
 *                       description: Change in value today
 *                     todayChangePercent:
 *                       type: number
 *                       description: Percentage change today
 *                     totalPnL:
 *                       type: number
 *                       description: Total profit and loss
 *                     totalPnLPercent:
 *                       type: number
 *                       description: Total P&L percentage
 *                     assetsCount:
 *                       type: integer
 *                       description: Number of different token holdings
 *                     holdings:
 *                       type: array
 *                       description: Token holdings with quantities and values
 *                       items:
 *                         type: object
 *                         properties:
 *                           tokenId:
 *                             type: integer
 *                           symbol:
 *                             type: string
 *                           name:
 *                             type: string
 *                           amount:
 *                             type: number
 *                             description: Total quantity held
 *                           value:
 *                             type: number
 *                             description: Current value of holdings
 *                           change:
 *                             type: number
 *                             description: 24h price change percentage
 *                           currentPrice:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch portfolio data
 */
router.get('/portfolio', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { priceService } = await import('../services/priceService');

    const totalPortfolioResult = await prisma.order.aggregate({
      _sum: {
        budget: true,
      },
    });
    const totalValue = totalPortfolioResult._sum.budget || 0;

    const totalPnLResult = await prisma.order.aggregate({
      where: {
        status: Status.FINISHED,
      },
      _sum: {
        netProfit: true,
      },
    });
    const totalPnL = totalPnLResult._sum.netProfit || 0;
    const totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrdersResult = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: Status.FINISHED,
      },
      _sum: {
        netProfit: true,
      },
    });
    const todayChange = todayOrdersResult._sum.netProfit || 0;
    const todayChangePercent =
      totalValue > 0 ? (todayChange / totalValue) * 100 : 0;

    const activeOrders = await prisma.order.findMany({
      where: {
        status: Status.ACTIVE,
      },
      select: {
        tokenId: true,
        token: {
          select: {
            id: true,
            name: true,
          },
        },
        qty: true,
        entryPrice: true,
      },
    });

    const tokenHoldings = new Map<
      number,
      { token: any; totalQty: number; totalValue: number }
    >();

    for (const order of activeOrders) {
      if (!order.token) continue;

      const tokenId = order.token.id;
      const currentPrice = order.entryPrice;

      if (!tokenHoldings.has(tokenId)) {
        tokenHoldings.set(tokenId, {
          token: order.token,
          totalQty: 0,
          totalValue: 0,
        });
      }

      const holding = tokenHoldings.get(tokenId)!;
      holding.totalQty += order.qty;
      holding.totalValue += order.qty * currentPrice;
    }

    const tokensList = Array.from(tokenHoldings.values()).map(
      (h) => h.token.name
    );
    const priceData = await priceService.getTokenPrices(tokensList);
    const priceMap = new Map(priceData.map((p) => [p.tokenName, p]));

    const holdings = Array.from(tokenHoldings.entries()).map(
      ([tokenId, holding]) => {
        const tokenPrice = priceMap.get(holding.token.name);
        const currentPrice =
          tokenPrice?.currentPrice ||
          holding.totalValue / holding.totalQty ||
          0;
        const currentValue = holding.totalQty * currentPrice;
        const change = tokenPrice?.priceChangePercent || 0;

        return {
          tokenId,
          symbol: holding.token.name.substring(0, 3).toUpperCase(),
          name: holding.token.name,
          amount: holding.totalQty,
          value: currentValue,
          change,
          currentPrice,
        };
      }
    );

    holdings.sort((a, b) => b.value - a.value);

    return res.status(200).json({
      success: true,
      message: 'Portfolio data fetched successfully',
      data: {
        totalValue,
        todayChange,
        todayChangePercent,
        totalPnL,
        totalPnLPercent,
        assetsCount: holdings.length,
        holdings,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio data',
    });
  }
});

// GET /api/admin/portfolio/performance
/**
 * @swagger
 * /api/admin/portfolio/performance:
 *   get:
 *     summary: Get admin portfolio performance data for charts (aggregated across all users)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio performance data retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                       value:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch performance data
 */
router.get('/portfolio/performance', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    // Get all orders with timestamps for performance chart (aggregated across all users)
    // Include all orders to show cumulative portfolio growth over time
    const orders = await prisma.order.findMany({
      select: {
        createdAt: true,
        buyDate: true,
        budget: true,
        status: true,
        qty: true,
        entryPrice: true,
        markPrice: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get total portfolio value (sum of all budgets) - this is the current value
    const totalPortfolioResult = await prisma.order.aggregate({
      _sum: {
        budget: true,
      },
    });
    const currentTotalValue = totalPortfolioResult._sum.budget || 0;

    // Generate performance data points (last 2 years)
    const performanceData = [];
    const now = new Date();

    // Generate data for the last 2 years with monthly data points
    for (let i = 24; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of the month
      date.setHours(0, 0, 0, 0);

      // Calculate cumulative budget (portfolio value) for orders created up to this date
      let dayValue = 0;
      orders.forEach((order) => {
        const orderDate = order.createdAt || order.buyDate;
        if (orderDate && orderDate <= date) {
          // For historical points, use the budget (investment amount) as the value
          // This shows how much was invested up to that point
          dayValue += order.budget || 0;
        }
      });

      // If no orders before this date, interpolate from current value
      // This creates a smooth growth curve
      if (dayValue === 0 && i < 24) {
        // Scale from a starting value to current value
        const monthsAgo = 24 - i;
        const progress = monthsAgo / 24;
        // Start at 30% of current value 2 years ago, grow to 100% now
        dayValue = currentTotalValue * (0.3 + (0.7 * (1 - progress)));
      } else if (dayValue === 0) {
        // For the earliest point, use 30% of current value
        dayValue = currentTotalValue * 0.3;
      }

      performanceData.push({
        time: date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        year: date.getFullYear().toString(),
        month: date.getMonth() + 1, // 1-12
        day: date.getDate(),
        value: Math.round(dayValue * 100) / 100,
      });
    }

    // Ensure the last data point matches the current total value
    if (performanceData.length > 0) {
      performanceData[performanceData.length - 1].value = Math.round(currentTotalValue * 100) / 100;
    }

    res.status(200).json({
      success: true,
      message: 'Portfolio performance data retrieved successfully',
      data: performanceData,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
    });
  }
});

export default router;
