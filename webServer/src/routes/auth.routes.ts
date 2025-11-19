import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

const genApiKey = () => `api_${crypto.randomBytes(16).toString('hex')}`;
const genApiSecret = () => `sec_${crypto.randomBytes(24).toString('hex')}`;
const genReferral = () =>
  `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const requireEnv = (key: string) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
};

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
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     fullname: { type: string }
 *                     username: { type: string }
 *                     email: { type: string }
 *                     isVerified: { type: boolean }
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials or account deactivated
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Account is deactivated' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      requireEnv('JWT_SECRET'),
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
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
 *             required: [fullname, username, email, password]
 *             properties:
 *               fullname: { type: string }
 *               username: { type: string }
 *               email:    { type: string }
 *               password: { type: string }

 *     responses:
 *       200:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Signup successful }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     fullname: { type: string }
 *                     username: { type: string }
 *                     email: { type: string }
 *                     isVerified: { type: boolean }
 *       400:
 *         description: Missing fields or user already exists
 *       409:
 *         description: Duplicate key (email/username/referralCode/apiKey/apiSecret)
 *       500:
 *         description: Internal server error
 */
router.post('/signup', async (req, res) => {
  try {
    let { fullname, username } = req.body ?? {};
    const { email, password } = req.body ?? {};

    if (!fullname || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullname, username, email and password are required',
      });
    }

    fullname = String(fullname).trim();
    username = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(String(password), 12);

    const apiKey = genApiKey();
    const apiSecret = genApiSecret();
    const referralCode = genReferral();

    const user = await prisma.user.create({
      data: {
        fullname,
        username,
        email: normalizedEmail,
        password: hashed,
        isActive: true,
        isVerified: false,
        tradeBalance: 0,
        profit: 0,
        apiKey,
        apiSecret,
        referralCode,
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        isVerified: true,
      },
    });

    return res.json({ success: true, message: 'Signup successful', user });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : 'unique field';
      return res
        .status(409)
        .json({ success: false, message: `Duplicate ${target}` });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/login/admin:
 *   post:
 *     summary: Admin login with environment credentials
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     email: { type: string }
 *                     isAdmin: { type: boolean, example: true }
 *       500:
 *         description: Admin credentials not configured
 */
router.post('/login/admin', async (req, res) => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: 'Admin credentials not configured',
      });
    }

    // Create a special admin user token
    const adminUser = {
      id: 0,
      email: adminUsername,
      isAdmin: true,
    };

    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, isAdmin: true },
      requireEnv('JWT_SECRET'),
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: adminUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
