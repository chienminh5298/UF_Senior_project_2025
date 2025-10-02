import request from 'supertest';
import express from 'express';
import adminRouter from '../../routes/admin.routes';
import { requireAuth } from '../../middleware/auth';
import prisma from '../../models/prismaClient';

// Mock the auth middleware
jest.mock('../../middleware/auth');
jest.mock('../../models/prismaClient', () => ({
  user: {
    findMany: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('GET /api/admin/users Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app).get('/api/admin/users').expect(401);

      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        req.user = undefined;
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should proceed when user is authenticated', async () => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });

      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Successful user data retrieval', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return users data successfully', async () => {
      const mockUsers = [
        {
          fullname: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com',
          isVerified: true,
          isActive: true,
          avatar: 1,
          tradeBalance: 1000,
          adminCommissionPercent: 0.3,
          referralCommissionPercent: 0.1,
          profit: 500,
        },
        {
          fullname: 'Jane Smith',
          username: 'janesmith',
          email: 'jane@example.com',
          isVerified: false,
          isActive: true,
          avatar: 2,
          tradeBalance: 2000,
          adminCommissionPercent: 0.3,
          referralCommissionPercent: 0.0,
          profit: 750,
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Users fetched successfully',
        data: { users: mockUsers },
      });

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Users fetched successfully',
        data: { users: [] },
      });
    });

    it('should return users with all required fields', async () => {
      const mockUser = {
        fullname: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        isActive: false,
        avatar: 0,
        tradeBalance: 0,
        adminCommissionPercent: 0.3,
        referralCommissionPercent: 0.0,
        profit: 0,
      };

      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0]).toEqual(mockUser);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.user.findMany as jest.Mock).mockRejectedValue(dbError);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch users',
      });
    });

    it('should handle Prisma client errors', async () => {
      const prismaError = new Error('Prisma client error');
      (prisma.user.findMany as jest.Mock).mockRejectedValue(prismaError);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch users',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null user object', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        req.user = null as any;
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle undefined user object', async () => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = undefined;
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });
  });

  describe('Data validation', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should only select required fields from database', async () => {
      const mockUsers = [
        {
          fullname: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
          isActive: true,
          avatar: 1,
          tradeBalance: 1000,
          adminCommissionPercent: 0.3,
          referralCommissionPercent: 0.1,
          profit: 500,
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });
});
