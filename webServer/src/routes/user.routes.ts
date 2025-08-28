import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET  /api/user/landing    # Landing page data
router.get('/landing', requireAuth, async (req, res) => {
    const { user } = req.body;  

    console.log(user);
    
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    try {
        const userTokens = await prisma.userToken.findMany({
            where: {
                userId: user.id
            }
        });

        res.status(200).json({
            success: true,
            message: 'Landing page data fetched successfully',
            data: userTokens
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch landing data' });
    }
});

// GET  /api/user/profile    # User profile
// GET  /api/user/orders     # User orders
// POST /api/user/tokens     # Add token

export default router;
