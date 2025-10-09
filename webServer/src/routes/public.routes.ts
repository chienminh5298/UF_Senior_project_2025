import { Router } from 'express';
import prisma from '../models/prismaClient';

const router = Router();

// GET  /api/public/health
/**
 * @swagger
 * /api/public/health:
 *   get:
 *     summary: Health check
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Health check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 uptime: { type: number }
 *       500: { description: Failed to check health }
 */
router.get('/health', async (req, res) => {
    try {
        const uptime = process.uptime();
        res.status(200).json({ success: true, message: 'Health check successful', uptime });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check health' });
    }
});

// GET  /api/public/landing
/**
 * @swagger
 * /api/public/landing:
 *   get:
 *     summary: Get landing page data
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Landing fetched successfully
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
 *                     total_user:
 *                       type: integer
 *                     total_fund:
 *                       type: number
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           id: { type: integer }
 *       500:
 *         description: Failed to fetch landing
 */

router.get('/landing', async (req, res) => {
  try{
    const total_user = await prisma.user.count();

    const total_fund = await prisma.order.aggregate({
      _sum: {
        budget: true,
      },
    });

    const tokens = await prisma.token.findMany({
        where: {
            isActive: true,
        },
        select: {
        name: true,
        id: true,
    }});

    res.status(200).json({ 
        success: true,
        message: 'Landing fetched successfully', 
        data: { total_user, total_fund, tokens } });
  }
  catch(error){
    res.status(500).json({ success: false, message: 'Failed to fetch landing' });
  }

});

export default router;
