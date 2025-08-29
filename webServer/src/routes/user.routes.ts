import { Router } from 'express';
import prisma from '../models/prismaClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET  /api/user/landing    # Landing page data
router.get('/landing', requireAuth, async (req, res) => {

    // Retrieve user object from requireAuth middleware
    const { user } = req;  
    console.log(user);

    // If user is not found, return 401
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    // Retrieve user data from database
    try {
        const userTokens = await prisma.userToken.findMany({
            where: {
                userId: user.id
            }
        });

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Landing page data fetched successfully',
            data: userTokens
        });
    } catch (error) {
        // Return error response
        res.status(500).json({ error: 'Failed to fetch landing data' });
    }
});

// GET  /api/user/profile    # User profile
// GET  /api/user/orders     # User orders
// POST /api/user/tokens     # Add token

export default router;
