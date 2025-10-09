import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
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
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const newUserToken = await prisma.userToken.create({
      data: { userId: user.id, tokenId },
    });

    return res.status(201).json({ success: true, message: 'Token added successfully', data: newUserToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to add token' });
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
