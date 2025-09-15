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
// GET  /api/admin/orders    # List orders
// GET  /api/admin/bills     # List bills

export default router;
