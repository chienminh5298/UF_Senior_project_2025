import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
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

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/user/tokens     # Add token

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
      return res
        .status(400)
        .json({
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
