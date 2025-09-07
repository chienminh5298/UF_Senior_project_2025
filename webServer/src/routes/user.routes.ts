import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';
import { isAscii } from 'buffer';

const router = Router();

/**
 * @swagger
 * /api/user/landing:
 *   get:
 *     summary: Get user landing page data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Landing page data retrieved
 *       401:
 *         description: Unauthorized
 */
// GET  /api/user/landing    # Landing page data
router.get('/landing', requireAuth, async (req, res) => {
  // Retrieve user object from requireAuth middleware
  const { user } = req;

  // If user is not found, return 401
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // Retrieve user data from database
  try {
    const userTokens = await prisma.userToken.findMany({
      where: {
        userId: user.id,
      },
    });

    // Get number of strategies
    const count = await prisma.userOrder.count({
        where: {
            userId: user.id,
        }
      });

    // Get the trade balance
    const tradeBalance = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tradeBalance: true },
    });
      

    // Get active strategies per user id (user --> userOrder --> order --> token))
    const activeStrategies = await prisma.userOrder.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      }
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Landing page data fetched successfully',
      data: {
        userTokens,
        count,
        tradeBalance,
        activeStrategies,
      },
    });
  } catch (error) {
    // Return error response
    res.status(500).json({ error: 'Failed to fetch landing data' });
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
// GET  /api/user/profile    # User profile
router.get('/profile', requireAuth, async (req, res) => {
    const { user } = req;

    // If user is not found, return 401
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Retrieve: firstName, lastName, email, timeZone
    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            fullname: true,
            email: true,
        },
    });

  res.status(200).json({
    success: true,
    message: 'Profile data fetched successfully',
    data: profile,
  });
});

// GET  /api/user/orders     # User orders
// POST /api/user/tokens     # Add token

export default router;
