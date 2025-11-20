import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { BillStatus, VoucherStatus } from '@prisma/client';
const router = Router();

// POST /api/user/tokens
/**
 * @swagger
 * /api/user/tokens:
 *   post:
 *     summary: Add user token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: integer
 *                 description: The ID of the token to add
 *                 example: 1
 *     responses:
 *       201:
 *         description: Token added successfully
 *       404:
 *         description: Token not found
 *       500:
 *         description: Failed to add token
 */
router.post('/tokens', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { tokenId } = req.body;

    const token = await prisma.token.findUnique({ where: { id: tokenId } });

    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: 'Token not found' });
    }

    const newUserToken = await prisma.userToken.create({
      data: { userId: user.id, tokenId },
    });

    return res.status(201).json({
      success: true,
      message: 'Token added successfully',
      data: newUserToken,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to add token' });
  }
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullname: true,
      email: true,
      username: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Profile data fetched successfully',
    data: profile,
  });
});

// PUT /api/user/profile
/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Username or email already in use
 *       500:
 *         description: Failed to update profile
 */
router.put('/profile', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    let { fullname, username, email } = req.body ?? {};

    const data: any = {};
    if (typeof fullname === 'string') {
      fullname = String(fullname).trim();
      if (fullname.length < 2) {
        return res
          .status(400)
          .json({ success: false, message: 'fullname is too short' });
      }
      data.fullname = fullname;
    }
    if (typeof username === 'string') {
      username = String(username).trim().toLowerCase();
      if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            'username must be 3-32 chars and contain only letters, numbers, _ . -',
        });
      }
      // Ensure unique username if changed
      const exists = await prisma.user.findFirst({
        where: { username, NOT: { id: user.id } },
        select: { id: true },
      });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'Username already in use' });
      }
      data.username = username;
    }
    if (typeof email === 'string') {
      email = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid email address' });
      }
      // Ensure unique email if changed
      const existsEmail = await prisma.user.findFirst({
        where: { email, NOT: { id: user.id } },
        select: { id: true },
      });
      if (existsEmail) {
        return res
          .status(409)
          .json({ success: false, message: 'Email already in use' });
      }
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No fields to update' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        isVerified: true,
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update profile' });
  }
});

// GET  /api/user/orders
/**
 * @swagger
 * /api/user/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [User]
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       orderId:
 *                         type: string
 *                       side:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       entryPrice:
 *                         type: number
 *                         format: float
 *                       qty:
 *                         type: number
 *                       budget:
 *                         type: number
 *                         format: float
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */

// GET /api/user/trading/positions
/**
 * @swagger
 * /api/user/trading/positions:
 *   get:
 *     summary: Get user's active trading positions
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trading positions retrieved successfully
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
 *                     activePositions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           orderId:
 *                             type: string
 *                           pair:
 *                             type: string
 *                           type:
 *                             type: string
 *                           size:
 *                             type: string
 *                           pnl:
 *                             type: string
 *                           pnlColor:
 *                             type: string
 *                           entry:
 *                             type: string
 *                           strategy:
 *                             type: string
 *                           investment:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                           currentValue:
 *                             type: number
 *                           markPrice:
 *                             type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPositions:
 *                           type: integer
 *                         totalPnL:
 *                           type: number
 *                         totalInvestment:
 *                           type: number
 *                         winRate:
 *                           type: number
 *                         availableCash:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch trading positions
 */
router.get('/trading/positions', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    // Get user's trade balance and profit (consistent with dashboard)
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        tradeBalance: true,
        profit: true,
      },
    });

    // Get user's active orders with related data
    const allActiveOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        token: {
          select: {
            id: true,
            name: true,
            stable: true,
          },
        },
        strategy: {
          select: {
            id: true,
            description: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Filter out orders with null tokenId or null token
    const activeOrders = allActiveOrders.filter(
      (order) => order.tokenId !== null && order.token !== null
    );

    // Get user's selected tokens (consistent with dashboard)
    const userTokens = await prisma.userToken.findMany({
      where: { userId: user.id },
      include: {
        token: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    // Import price service to get current prices for accurate P&L calculation
    const { priceService } = await import('../services/priceService');

    // Create positions for each selected token (not just active orders)
    const activePositions = await Promise.all(
      userTokens.map(async (userToken) => {
        // Find if there's an active order for this token
        const activeOrder = activeOrders.find(
          (order) =>
            order.tokenId === userToken.token?.id && order.token !== null
        );

        if (activeOrder && userToken.token && activeOrder.token) {
          // Token has an active order - calculate P&L using current market price
          let currentPrice = activeOrder.markPrice || activeOrder.entryPrice;

          // Get current market price for accurate P&L
          try {
            const tokenPrices = await priceService.getTokenPrices([
              userToken.token.name,
            ]);
            if (tokenPrices.length > 0 && tokenPrices[0].currentPrice) {
              currentPrice = tokenPrices[0].currentPrice;
            }
          } catch (error) {
            console.error(
              `Error fetching price for ${userToken.token.name}:`,
              error
            );
          }

          // Calculate current value and unrealized P&L
          const currentValue = activeOrder.qty * currentPrice;

          // Calculate unrealized P&L based on current price
          let unrealizedPnL = 0;
          if (activeOrder.side === 'BUY') {
            unrealizedPnL =
              (currentPrice - activeOrder.entryPrice) * activeOrder.qty;
          } else {
            // SELL (short)
            unrealizedPnL =
              (activeOrder.entryPrice - currentPrice) * activeOrder.qty;
          }

          const pnlColor =
            unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400';

          return {
            id: activeOrder.id,
            orderId: activeOrder.orderId,
            pair: `${userToken.token.name}/USDT`,
            type: activeOrder.side === 'BUY' ? 'Long' : 'Short',
            size: `${activeOrder.qty} ${userToken.token.name}`,
            pnl: `${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)}`,
            pnlValue: unrealizedPnL,
            pnlColor,
            entry: `$${activeOrder.entryPrice.toLocaleString()}`,
            strategy: activeOrder.strategy
              ? activeOrder.strategy.description
              : 'Active Trading',
            investment: `$${activeOrder.budget.toFixed(2)}`,
            startDate: new Date(activeOrder.timestamp).toLocaleDateString(),
            currentValue,
            markPrice: currentPrice,
            hasActiveOrder: true,
          };
        } else if (userToken.token) {
          // Token is selected but no active order (available for trading)
          return {
            id: userToken.id,
            orderId: null,
            pair: `${userToken.token.name}/USDT`,
            type: 'Available',
            size: `0 ${userToken.token.name}`,
            pnl: '$0.00',
            pnlColor: 'text-gray-400',
            entry: 'Not started',
            strategy: 'Ready to trade',
            investment: '$0.00',
            startDate: 'Not started',
            currentValue: 0,
            markPrice: 0,
            hasActiveOrder: false,
          };
        } else {
          return null;
        }
      })
    );

    // Filter out null positions
    const validActivePositions = activePositions
      .filter((position) => position !== null)
      .filter((position) => {
        if (position.hasActiveOrder) {
          return (
            position.orderId !== null &&
            position.orderId !== undefined &&
            position.pair !== 'Unknown/USDT'
          );
        }
        return true;
      });

    // Calculate summary statistics (consistent with dashboard)
    // Sum up the calculated P&L from active positions
    const activePositionsPnL = validActivePositions.reduce((sum, position) => {
      if (position.hasActiveOrder && typeof position.pnlValue === 'number') {
        return sum + position.pnlValue;
      }
      return sum;
    }, 0);

    // Total P&L = user's historical profit + current active positions P&L (same as dashboard)
    const totalPnL = (userData?.profit || 0) + activePositionsPnL;
    const totalInvestment = activeOrders.reduce(
      (sum, order) => sum + order.budget,
      0
    );
    const availableCash = (userData?.tradeBalance || 0) - totalInvestment;

    // Calculate win rate (simplified - in real app this would be more complex)
    const winRate =
      activeOrders.length > 0
        ? Math.round(
            (activeOrders.filter((order) => order.netProfit > 0).length /
              activeOrders.length) *
              100
          )
        : 0;

    res.status(200).json({
      success: true,
      message: 'Trading positions retrieved successfully',
      data: {
        activePositions: validActivePositions,
        summary: {
          totalPositions: userTokens.length, // Same as active tokens count
          activeTokensCount: userTokens.length, // Same as dashboard
          totalPnL, // Now consistent with dashboard
          totalInvestment,
          winRate,
          availableCash: Math.max(0, availableCash),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trading positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trading positions',
    });
  }
});

router.get('/orders', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        token: {
          select: { id: true, name: true, stable: true },
        },
        strategy: {
          select: { id: true, description: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/user/settings
/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully
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
 *                     fullname:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch settings
 */
router.get('/settings', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        fullname: true,
        email: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Settings fetched successfully',
      data: settings,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch settings' });
  }
});

// GET /api/user/portfolio
/**
 * @swagger
 * /api/user/portfolio:
 *   get:
 *     summary: Get user portfolio data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio data retrieved successfully
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
 *                       description: Total portfolio value
 *                     totalPnL:
 *                       type: number
 *                       description: Total profit/loss
 *                     totalPnLPercent:
 *                       type: number
 *                       description: Total profit/loss percentage
 *                     activeTokensCount:
 *                       type: integer
 *                       description: Number of active tokens
 *                     availableTokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                     userTokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           token:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               isActive:
 *                                 type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch portfolio data
 */
router.get('/portfolio', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    // Get user's current balance and profit from user record
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        tradeBalance: true,
        profit: true,
      },
    });

    // Get user's active orders to calculate current position values
    const activeOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        token: true,
        strategy: true,
      },
    });

    // Calculate current value of active positions
    let activePositionsValue = 0;
    let activePositionsPnL = 0;
    const activeTokensFromOrders = new Set();

    // Import price service to get current prices for accurate P&L calculation
    const { priceService } = await import('../services/priceService');

    // Calculate P&L
    for (const order of activeOrders) {
      if (!order.token) continue;

      // Get current market price for the token
      let currentPrice = order.markPrice || order.entryPrice;
      try {
        const tokenPrices = await priceService.getTokenPrices([
          order.token.name,
        ]);
        if (tokenPrices.length > 0 && tokenPrices[0].currentPrice) {
          currentPrice = tokenPrices[0].currentPrice;
        }
      } catch (error) {
        console.error(`Error fetching price for ${order.token.name}:`, error);
      }

      // Calculate current value of the position
      const currentValue = order.qty * currentPrice;
      activePositionsValue += currentValue;

      // Calculate unrealized P&L based on current price
      let unrealizedPnL = 0;
      if (order.side === 'BUY') {
        unrealizedPnL = (currentPrice - order.entryPrice) * order.qty;
      } else {
        unrealizedPnL = (order.entryPrice - currentPrice) * order.qty;
      }
      activePositionsPnL += unrealizedPnL;

      if (order.token) {
        activeTokensFromOrders.add(order.token.id);
      }
    }

    // Total portfolio value = trade balance + current value of active positions
    const totalValue = (userData?.tradeBalance || 0) + activePositionsValue;

    // Total P&L = user's historical profit + current active positions P&L
    const totalPnL = (userData?.profit || 0) + activePositionsPnL;

    // Calculate P&L percentage based on total value
    const totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

    // Get available tokens (all active tokens in the system)
    const availableTokens = await prisma.token.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    // Get user's selected tokens (tokens the user has chosen to trade)
    const userTokens = await prisma.userToken.findMany({
      where: { userId: user.id },
      include: {
        token: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Portfolio data retrieved successfully',
      data: {
        totalValue,
        totalPnL,
        totalPnLPercent,
        activeTokensCount: userTokens.length, // Number of tokens user has selected
        availableTokens,
        userTokens,
        tradeBalance: userData?.tradeBalance || 0,
        activePositionsValue,
        activePositionsPnL,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio data',
    });
  }
});

// GET /api/user/portfolio/performance
/**
 * @swagger
 * /api/user/portfolio/performance:
 *   get:
 *     summary: Get user portfolio performance data for charts
 *     tags: [User]
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
    // Get user's trade balance
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        tradeBalance: true,
      },
    });

    // Get user's orders with timestamps for performance chart
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        buyDate: true,
        qty: true,
        entryPrice: true,
        markPrice: true,
        netProfit: true,
      },
      orderBy: {
        buyDate: 'asc',
      },
    });

    // Generate performance data points (last 2 years)
    const performanceData = [];
    const now = new Date();
    const baseBalance = userData?.tradeBalance || 0;

    // Generate data for the last 2 years with monthly data points
    for (let i = 24; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of the month
      date.setHours(0, 0, 0, 0);

      // Calculate portfolio value for this date
      let dayValue = baseBalance; // Start with trade balance
      orders.forEach((order) => {
        if (order.buyDate <= date) {
          const currentPrice = order.markPrice || order.entryPrice;
          dayValue += order.qty * currentPrice;
        }
      });

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

// GET /api/user/tokens/available
/**
 * @swagger
 * /api/user/tokens/available:
 *   get:
 *     summary: Get all available tokens for trading
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available tokens retrieved successfully
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       stable:
 *                         type: string
 *                       minQty:
 *                         type: number
 *                       leverage:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch available tokens
 */
router.get('/tokens/available', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    // Get all active tokens that admin has enabled
    const availableTokens = await prisma.token.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stable: true,
        minQty: true,
        leverage: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Available tokens retrieved successfully',
      data: availableTokens,
    });
  } catch (error) {
    console.error('Error fetching available tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tokens',
    });
  }
});

// GET /api/user/orders/price-data
/**
 * @swagger
 * /api/user/orders/price-data:
 *   get:
 *     summary: Get current token prices
 *     tags: [User]
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

export default router;

// POST /api/user/settings
/**
 * @swagger
 * /api/user/settings:
 *   post:
 *     summary: Update user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Current password and new password are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update settings
 */
router.post('/settings', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user_password = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        password: true,
      },
    });

    if (
      !(await bcrypt.compare(currentPassword, user_password?.password || ''))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res
      .status(200)
      .json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update password' });
  }
});

// POST api/user/claim
/**
 * @swagger
 * /api/user/claim:
 *   post:
 *     summary: Claim bills
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               network:
 *                 type: string
 *               address:
 *                 type: string
 *               hashId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create claim
 */
router.post('/claim', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { billIds = [], network, address, hashId } = req.body;

    // Fetch bills with their stored commission rates
    const bills = await prisma.bill.findMany({
      where: { id: { in: billIds }, userId: user.id }, // Ensure bills belong to user
    });

    if (bills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid bills found for claim',
      });
    }

    const voucher = await prisma.voucher.findFirst({
      where: { userId: user.id, status: VoucherStatus.inuse },
    });

    let totalNetProfit = 0;
    let totalCommission = 0;

    // Calculate total netProfit and commission using each bill's stored commission rate
    for (const bill of bills) {
      totalNetProfit += bill.netProfit;

      // Bill commission is stored as percentage (30) in DB, convert to decimal (0.3) if needed
      // Check if commission is stored as percentage (> 1) or decimal (<= 1)
      const billCommissionPercent =
        bill.adminCommissionPercent > 1
          ? bill.adminCommissionPercent / 100
          : bill.adminCommissionPercent;
      const billReferralCommissionPercent =
        bill.referralCommissionPercent > 1
          ? bill.referralCommissionPercent / 100
          : bill.referralCommissionPercent;

      // Only calculate commission if bill has positive netProfit
      if (bill.netProfit > 0) {
        totalCommission +=
          bill.netProfit *
          (billCommissionPercent + billReferralCommissionPercent);
      }
    }

    // If voucher is active, no commission (user gets full amount)
    const amount =
      voucher && voucher.status === VoucherStatus.inuse
        ? totalNetProfit
        : totalNetProfit - totalCommission;

    if (!amount) {
      return res
        .status(400)
        .json({ success: false, message: 'No bills to claim' });
    }

    if (!billIds.length || !network || !address || !hashId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const claim = await prisma.claim.create({
      data: {
        amount,
        bills: { connect: billIds.map((id: number) => ({ id })) },
        network,
        address,
        hashId,
        userId: user.id,
      },
    });

    await prisma.bill.updateMany({
      where: { id: { in: billIds } },
      data: { status: BillStatus.CLAIMED },
    });

    return res.status(200).json({
      success: true,
      message: 'Claim created successfully',
      data: claim,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create claim' });
  }
});

// GET /api/user/bills
/**
 * @swagger
 * /api/user/bills:
 *   get:
 *     summary: Get user bills
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Page number
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: Number of bills per page
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [5, 10, 25]
 *           default: 10
 *     responses:
 *       200:
 *         description: Bills fetched successfully
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
 *                     bills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           netProfit:
 *                             type: number
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           from:
 *                             type: string
 *                           to:
 *                             type: string
 *                           note:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalBills:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch bills
 */
router.get('/bills', requireAuth, async (req, res) => {
  const { user } = req;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const validLimits = [5, 10, 25];
  const validatedLimit = validLimits.includes(limit) ? limit : 10;

  try {
    const skip = (page - 1) * validatedLimit;

    const totalBills = await prisma.bill.count({
      where: {
        userId: user.id,
        netProfit: { gt: 0 },
      },
    });

    const bills = await prisma.bill.findMany({
      where: {
        userId: user.id,
        netProfit: { gt: 0 },
      },
      skip,
      take: validatedLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        netProfit: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        from: true,
        to: true,
        note: true,
        adminCommissionPercent: true,
        referralCommissionPercent: true,
        claimId: true,
        claim: {
          select: {
            id: true,
            status: true,
            adminNote: true,
            hashId: true,
          },
        },
        orders: {
          select: {
            id: true,
            token: {
              select: {
                id: true,
                name: true,
              },
            },
            sellDate: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalBills / validatedLimit);

    return res.status(200).json({
      success: true,
      message: 'Bills fetched successfully',
      data: {
        bills,
        pagination: {
          currentPage: page,
          totalPages,
          totalBills,
          limit: validatedLimit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch bills' });
  }
});

// GET /api/user/notifications
/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50]
 *           default: 25
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch notifications
 */
router.get('/notifications', requireAuth, async (req, res) => {
  const { user } = req;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const validLimits = [10, 25, 50];
    const validatedLimit = validLimits.includes(limit) ? limit : 25;
    const skip = (page - 1) * validatedLimit;

    const totalNotifications = await prisma.notification.count({
      where: { userId: user.id },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      skip,
      take: validatedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        claim: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalNotifications / validatedLimit);

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          limit: validatedLimit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

// PATCH /api/user/notifications/:id/read
/**
 * @swagger
 * /api/user/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Failed to update notification
 */
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== user.id) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification: updated },
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
    });
  }
});

// PATCH /api/user/notifications/read-all
/**
 * @swagger
 * /api/user/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update notifications
 */
router.patch('/notifications/read-all', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
    });
  }
});

// POST /api/user/bills/pay
/**
 * @swagger
 * /api/user/bills/pay:
 *   post:
 *     summary: Submit payment for bills and create a claim
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [billIds, hashId, amount, network, address]
 *             properties:
 *               billIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               hashId:
 *                 type: string
 *               amount:
 *                 type: number
 *               network:
 *                 type: string
 *                 enum: [ERC20, SOLANA, BEP20]
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment submitted successfully and claim created
 *       400:
 *         description: Missing required fields or invalid bills
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to submit payment
 */
router.post('/bills/pay', requireAuth, async (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { billIds, hashId, amount, network, address } = req.body;

    // Validate billIds
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill IDs are required',
      });
    }

    // Validate each required field with specific error messages
    const missingFields: string[] = [];
    if (!hashId || (typeof hashId === 'string' && hashId.trim() === '')) {
      missingFields.push('Hash ID');
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      missingFields.push('Amount');
    }
    if (!network || (typeof network === 'string' && network.trim() === '')) {
      missingFields.push('Network');
    }
    if (!address || (typeof address === 'string' && address.trim() === '')) {
      missingFields.push('Address');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate network enum
    const validNetworks = ['ERC20', 'SOLANA', 'BEP20'];
    if (!validNetworks.includes(network)) {
      return res.status(400).json({
        success: false,
        message: `Invalid network. Must be one of: ${validNetworks.join(', ')}`,
      });
    }

    // Verify bills belong to user and are unpaid or rejected (rejected bills can be paid again)
    const bills = await prisma.bill.findMany({
      where: {
        id: { in: billIds },
        userId: user.id,
        status: { in: [BillStatus.NEW, BillStatus.REJECTED] }, // Allow NEW and REJECTED bills to be paid
        netProfit: { gt: 0 },
      },
    });

    if (bills.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No valid payable bills found. Bills must be unpaid (NEW) or rejected (REJECTED) status.',
      });
    }

    if (bills.length !== billIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some bills are invalid, already paid, or pending approval',
      });
    }

    // Calculate total commission for the selected bills
    // Helper function to round up to 2 decimal places
    const roundUpToCents = (value: number): number => {
      return Math.ceil(value * 100) / 100;
    };

    let totalCommission = 0;
    for (const bill of bills) {
      const adminCommissionPercent =
        bill.adminCommissionPercent > 1
          ? bill.adminCommissionPercent / 100
          : bill.adminCommissionPercent;
      const referralCommissionPercent =
        bill.referralCommissionPercent > 1
          ? bill.referralCommissionPercent / 100
          : bill.referralCommissionPercent;

      if (bill.netProfit > 0) {
        const billCommission =
          bill.netProfit * (adminCommissionPercent + referralCommissionPercent);
        totalCommission += billCommission;
      }
    }

    // Round up the total commission to 2 decimal places
    totalCommission = roundUpToCents(totalCommission);

    // Create a claim that groups all selected bills together with one payment hash ID
    // Status is NEW (pending admin approval)
    const claim = await prisma.claim.create({
      data: {
        amount: totalCommission, // The commission amount being paid
        bills: { connect: billIds.map((id: number) => ({ id })) },
        network: network as any, // ERC20, SOLANA, or BEP20
        address: address,
        hashId: hashId,
        userId: user.id,
        status: 'NEW', // Pending admin approval
      },
    });

    // Update bills to PROCESSING status (pending admin approval) and link them to the claim
    await prisma.bill.updateMany({
      where: {
        id: { in: billIds },
      },
      data: {
        status: BillStatus.PROCESSING, // Pending admin approval
        claimId: claim.id,
        hashId: hashId, // Store hash ID on bills as well for reference
      },
    });

    // Create notification for user about pending payment
    await prisma.notification.create({
      data: {
        type: 'PAYMENT_PENDING',
        title: 'Payment Submitted',
        message: `Your payment of $${totalCommission.toFixed(2)} has been submitted and is pending admin approval.`,
        userId: user.id,
        claimId: claim.id,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        'Payment submitted successfully. Claim created and pending admin approval.',
      data: {
        claimId: claim.id,
        billsUpdated: bills.length,
        totalCommission: totalCommission,
      },
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit payment',
    });
  }
});
