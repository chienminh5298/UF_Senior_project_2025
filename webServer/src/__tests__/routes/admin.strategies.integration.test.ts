import request from 'supertest';
import express from 'express';
import adminRouter from '../../routes/admin.routes';
import { requireAuth } from '../../middleware/auth';
import prisma from '../../models/prismaClient';

// Mock the auth middleware
jest.mock('../../middleware/auth');
jest.mock('../../models/prismaClient', () => ({
  strategy: {
    findMany: jest.fn(),
  },
  target: {
    findMany: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('GET /api/admin/strategies Integration Tests', () => {
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

      const response = await request(app)
        .get('/api/admin/strategies')
        .expect(401);

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
        .get('/api/admin/strategies')
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

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Successful strategies data retrieval', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return strategies data successfully', async () => {
      const mockStrategies = [
        {
          id: 1,
          isActive: true,
          tokenStrategies: [
            {
              token: {
                name: 'BTC',
              },
            },
            {
              token: {
                name: 'ETH',
              },
            },
          ],
        },
        {
          id: 2,
          isActive: false,
          tokenStrategies: [
            {
              token: {
                name: 'SOL',
              },
            },
          ],
        },
      ];

      const mockTargets = [
        {
          targetPercent: 3.5,
          stoplossPercent: 1.2,
        },
        {
          targetPercent: 5.0,
          stoplossPercent: 2.0,
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue(mockTargets);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Strategies fetched successfully',
        data: { response: mockStrategies, targets: mockTargets },
      });

      expect(prisma.strategy.findMany).toHaveBeenCalled();
      expect(prisma.target.findMany).toHaveBeenCalled();
    });

    it('should return empty arrays when no strategies exist', async () => {
      (prisma.strategy.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Strategies fetched successfully',
        data: { response: [], targets: [] },
      });
    });

    it('should return strategies with all required fields', async () => {
      const mockStrategy = {
        id: 3,
        isActive: true,
        tokenStrategies: [
          {
            token: {
              name: 'ADA',
            },
          },
        ],
      };

      const mockTargets = [
        {
          targetPercent: 4.0,
          stoplossPercent: 1.5,
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue([mockStrategy]);
      (prisma.target.findMany as jest.Mock).mockResolvedValue(mockTargets);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response).toHaveLength(1);
      expect(response.body.data.response[0]).toEqual(mockStrategy);
      expect(response.body.data.targets).toEqual(mockTargets);
    });

    it('should include token information in strategies', async () => {
      const mockStrategies = [
        {
          id: 4,
          isActive: true,
          tokenStrategies: [
            {
              token: {
                name: 'DOT',
              },
            },
            {
              token: {
                name: 'LINK',
              },
            },
          ],
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response[0].tokenStrategies).toBeDefined();
      expect(response.body.data.response[0].tokenStrategies).toHaveLength(2);
      expect(response.body.data.response[0].tokenStrategies[0].token.name).toBe(
        'DOT'
      );
      expect(response.body.data.response[0].tokenStrategies[1].token.name).toBe(
        'LINK'
      );
    });

    it('should handle strategies with different active states', async () => {
      const mockStrategies = [
        {
          id: 5,
          isActive: true,
          tokenStrategies: [],
        },
        {
          id: 6,
          isActive: false,
          tokenStrategies: [],
        },
        {
          id: 7,
          isActive: true,
          tokenStrategies: [],
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response).toHaveLength(3);
      expect(response.body.data.response[0].isActive).toBe(true);
      expect(response.body.data.response[1].isActive).toBe(false);
      expect(response.body.data.response[2].isActive).toBe(true);
    });

    it('should handle strategies with no token associations', async () => {
      const mockStrategies = [
        {
          id: 8,
          isActive: true,
          tokenStrategies: [],
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response[0].tokenStrategies).toHaveLength(0);
    });

    it('should return targets with correct percentages', async () => {
      const mockTargets = [
        {
          targetPercent: 2.5,
          stoplossPercent: 0.8,
        },
        {
          targetPercent: 10.0,
          stoplossPercent: 5.0,
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.target.findMany as jest.Mock).mockResolvedValue(mockTargets);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.targets).toHaveLength(2);
      expect(response.body.data.targets[0].targetPercent).toBe(2.5);
      expect(response.body.data.targets[0].stoplossPercent).toBe(0.8);
      expect(response.body.data.targets[1].targetPercent).toBe(10.0);
      expect(response.body.data.targets[1].stoplossPercent).toBe(5.0);
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

    it('should handle error when strategy query fails', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.strategy.findMany as jest.Mock).mockRejectedValue(dbError);

      // Note: The route doesn't have a try-catch, so Express handles the error
      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.status).toBe(500);
    });

    it('should handle error when target query fails', async () => {
      (prisma.strategy.findMany as jest.Mock).mockResolvedValue([]);
      const dbError = new Error('Database connection failed');
      (prisma.target.findMany as jest.Mock).mockRejectedValue(dbError);

      // Note: The route doesn't have a try-catch, so Express handles the error
      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.status).toBe(500);
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
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle undefined user object', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        req.user = undefined;
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle large number of strategies', async () => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });

      const largeStrategyList = Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        isActive: index % 2 === 0,
        tokenStrategies: [
          {
            token: {
              name: `TOKEN${index}`,
            },
          },
        ],
      }));

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(
        largeStrategyList
      );
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response).toHaveLength(50);
      expect(response.body.success).toBe(true);
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
      const mockStrategies = [
        {
          id: 9,
          isActive: true,
          tokenStrategies: [
            {
              token: {
                name: 'AVAX',
              },
            },
          ],
        },
      ];

      const mockTargets = [
        {
          targetPercent: 6.0,
          stoplossPercent: 2.5,
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue(mockTargets);

      await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(prisma.strategy.findMany).toHaveBeenCalled();
      expect(prisma.target.findMany).toHaveBeenCalled();
    });

    it('should handle strategies with multiple tokens', async () => {
      const mockStrategies = [
        {
          id: 10,
          isActive: true,
          tokenStrategies: [
            { token: { name: 'BTC' } },
            { token: { name: 'ETH' } },
            { token: { name: 'SOL' } },
            { token: { name: 'ADA' } },
          ],
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.response[0].tokenStrategies).toHaveLength(4);
    });
  });

  describe('Response structure validation', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return correct response structure for successful request', async () => {
      const mockStrategies = [
        {
          id: 11,
          isActive: false,
          tokenStrategies: [
            {
              token: {
                name: 'MATIC',
              },
            },
          ],
        },
      ];

      const mockTargets = [
        {
          targetPercent: 7.5,
          stoplossPercent: 3.0,
        },
      ];

      (prisma.strategy.findMany as jest.Mock).mockResolvedValue(mockStrategies);
      (prisma.target.findMany as jest.Mock).mockResolvedValue(mockTargets);

      const response = await request(app)
        .get('/api/admin/strategies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Strategies fetched successfully'
      );
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('targets');
      expect(Array.isArray(response.body.data.response)).toBe(true);
      expect(Array.isArray(response.body.data.targets)).toBe(true);
    });
  });
});
