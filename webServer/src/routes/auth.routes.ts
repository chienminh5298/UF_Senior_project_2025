import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials or account deactivated
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Prisma find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user accoutn is active. Account is deactivated if user fails to pay after 7 days.
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password --ill use bcrypt later--
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token {id, email}
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token: token,

      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signup successful
 *       400:
 *         description: Missing fields or user already exists
 */
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    await prisma.user.create({
      data: {
        email,
        password,
        isActive: true,
        isVerified: false,
        availableBalance: 0,
        tradeBalance: 0,
        profit: 0,
        commission: 0,
        fullname: fullname,
        username: username,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Return success response
    res.json({
      success: true,
      message: 'Signup successful',
    });
  } catch (error) {
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// *TEMP* Prisma to create a test user
router.post('/create-test-user', async (req, res) => {
  try {
    const testUser = await prisma.user.create({
      data: {
        fullname: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        availableBalance: 1000,
        tradeBalance: 500,
        profit: 0,
        commission: 0,
        isActive: true,
        isVerified: true,
      },
    });

    res.json({
      message: 'Test user created successfully',
      user: {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create test user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
