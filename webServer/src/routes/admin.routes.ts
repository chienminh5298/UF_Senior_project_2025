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
      select: { isActive: true }
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
      data: { user: user_specific }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status'
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
        token: { where: { isActive: true }, select: { name: true } },
        user: { where: { isActive: true }, select: { id: true, email: true } },
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
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch stats }
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
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
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const response = await prisma.strategy.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        isActive: true,
        targets: {
          select: {
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
  if (!user)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const {
      description,
      contribution,
      tokenStrategies = [],
      targets = [],
      direction = 'SAME',
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
      isCloseBeforeNewCandle: false,
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
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Tokens fetched successfully',
      data: { tokens }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tokens'
    });
  }
});

export default router;

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
  if (!user)
    return res.status(401).json({ success: false, message: 'Unauthorized' });
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
  if (!user)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

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
      message:
        "Token ${!deactivate ? 'deactivated' : 'activated'} successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update token' });
  }
});
