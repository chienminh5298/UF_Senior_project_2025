import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/user/tokens:
 *   get:
 *     summary: Get user tokens
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/tokens', requireAuth, async (req, res) => {
  // Retrieve user object from requireAuth middleware
  const { user } = req;

  // If user is not found, return 401
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // Retrieve user tokens
  try {
    const userTokens = await prisma.userToken.findMany({
      where: {
        userId: user.id,
      },
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Tokens fetched successfully',
      data: {
        tokens: userTokens,
      },
    });
  } catch (error) {
    // Return error response
    res.status(500).json({ error: 'Failed to fetch tokens' });
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

  // If user is not found, return 401
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // Retrieve: firstName, username, email, timeZone
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
        select: {
          id: true,
          orderId: true,
          side: true,
          timestamp: true,
          entryPrice: true,
          qty: true,
          budget: true,
          status: true,
        },
    });

    res.status(200).json({ success: true, message: 'Orders fetched successfully', data: orders });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


// POST /api/user/tokens     # Add token

export default router;
