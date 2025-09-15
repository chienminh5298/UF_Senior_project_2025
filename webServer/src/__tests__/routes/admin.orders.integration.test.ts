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
  order: {
    findMany: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('GET /api/admin/orders Integration Tests', () => {
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

      const response = await request(app).get('/api/admin/orders').expect(401);

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
        .get('/api/admin/orders')
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

      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Successful orders data retrieval', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return orders data successfully', async () => {
      const mockOrders = [
        {
          orderId: 'ORD-001',
          buyDate: '2024-01-15T10:30:00Z',
          sellDate: '2024-01-15T15:45:00Z',
          token: {
            name: 'BTC',
          },
          side: 'BUY',
          budget: 1000.0,
          qty: 0.025,
          strategyId: 1,
          netProfit: 150.5,
          entryPrice: 40000.0,
        },
        {
          orderId: 'ORD-002',
          buyDate: '2024-01-16T09:15:00Z',
          sellDate: null,
          token: {
            name: 'ETH',
          },
          side: 'SELL',
          budget: 2000.0,
          qty: 0.8,
          strategyId: 2,
          netProfit: -75.2,
          entryPrice: 2500.0,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Orders fetched successfully',
        data: { orders: mockOrders },
      });

      expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no orders exist', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Orders fetched successfully',
        data: { orders: [] },
      });
    });

    it('should return orders with all required fields', async () => {
      const mockOrder = {
        orderId: 'ORD-003',
        buyDate: '2024-01-17T14:20:00Z',
        sellDate: '2024-01-17T16:30:00Z',
        token: {
          name: 'ADA',
        },
        side: 'BUY',
        budget: 500.0,
        qty: 1000.0,
        strategyId: 3,
        netProfit: 25.75,
        entryPrice: 0.5,
      };

      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0]).toEqual(mockOrder);
    });

    it('should include token information in orders', async () => {
      const mockOrders = [
        {
          orderId: 'ORD-004',
          buyDate: '2024-01-18T11:00:00Z',
          sellDate: null,
          token: {
            name: 'SOL',
          },
          side: 'BUY',
          budget: 1500.0,
          qty: 5.0,
          strategyId: 1,
          netProfit: 0.0,
          entryPrice: 300.0,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders[0].token).toBeDefined();
      expect(response.body.data.orders[0].token.name).toBe('SOL');
    });

    it('should handle orders with null sellDate', async () => {
      const mockOrders = [
        {
          orderId: 'ORD-005',
          buyDate: '2024-01-19T08:30:00Z',
          sellDate: null,
          token: {
            name: 'DOT',
          },
          side: 'SELL',
          budget: 800.0,
          qty: 20.0,
          strategyId: 2,
          netProfit: 0.0,
          entryPrice: 40.0,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders[0].sellDate).toBeNull();
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
      (prisma.order.findMany as jest.Mock).mockRejectedValue(dbError);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch orders',
      });
    });

    it('should handle Prisma client errors', async () => {
      const prismaError = new Error('Prisma client error');
      (prisma.order.findMany as jest.Mock).mockRejectedValue(prismaError);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch orders',
      });
    });

    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      (prisma.order.findMany as jest.Mock).mockRejectedValue(timeoutError);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch orders',
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
        .get('/api/admin/orders')
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
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle large number of orders', async () => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });

      const largeOrderList = Array.from({ length: 100 }, (_, index) => ({
        orderId: `ORD-${String(index + 1).padStart(3, '0')}`,
        buyDate: '2024-01-15T10:30:00Z',
        sellDate: '2024-01-15T15:45:00Z',
        token: {
          name: 'BTC',
        },
        side: 'BUY',
        budget: 1000.0,
        qty: 0.025,
        strategyId: 1,
        netProfit: 150.5,
        entryPrice: 40000.0,
      }));

      (prisma.order.findMany as jest.Mock).mockResolvedValue(largeOrderList);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders).toHaveLength(100);
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
      const mockOrders = [
        {
          orderId: 'ORD-006',
          buyDate: '2024-01-20T12:00:00Z',
          sellDate: '2024-01-20T14:00:00Z',
          token: {
            name: 'MATIC',
          },
          side: 'BUY',
          budget: 300.0,
          qty: 500.0,
          strategyId: 1,
          netProfit: 45.0,
          entryPrice: 0.6,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it('should handle orders with different sides', async () => {
      const mockOrders = [
        {
          orderId: 'ORD-007',
          buyDate: '2024-01-21T09:00:00Z',
          sellDate: null,
          token: {
            name: 'LINK',
          },
          side: 'BUY',
          budget: 400.0,
          qty: 50.0,
          strategyId: 2,
          netProfit: 0.0,
          entryPrice: 8.0,
        },
        {
          orderId: 'ORD-008',
          buyDate: '2024-01-21T10:00:00Z',
          sellDate: '2024-01-21T11:00:00Z',
          token: {
            name: 'UNI',
          },
          side: 'SELL',
          budget: 600.0,
          qty: 100.0,
          strategyId: 3,
          netProfit: -30.0,
          entryPrice: 6.0,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.orders[0].side).toBe('BUY');
      expect(response.body.data.orders[1].side).toBe('SELL');
    });

    it('should handle orders with different strategy IDs', async () => {
      const mockOrders = [
        {
          orderId: 'ORD-009',
          buyDate: '2024-01-22T08:00:00Z',
          sellDate: null,
          token: {
            name: 'AVAX',
          },
          side: 'BUY',
          budget: 700.0,
          qty: 10.0,
          strategyId: 1,
          netProfit: 0.0,
          entryPrice: 70.0,
        },
        {
          orderId: 'ORD-010',
          buyDate: '2024-01-22T09:00:00Z',
          sellDate: null,
          token: {
            name: 'ATOM',
          },
          side: 'BUY',
          budget: 500.0,
          qty: 25.0,
          strategyId: 2,
          netProfit: 0.0,
          entryPrice: 20.0,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.orders[0].strategyId).toBe(1);
      expect(response.body.data.orders[1].strategyId).toBe(2);
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
      const mockOrders = [
        {
          orderId: 'ORD-011',
          buyDate: '2024-01-23T13:00:00Z',
          sellDate: '2024-01-23T15:00:00Z',
          token: {
            name: 'FTM',
          },
          side: 'BUY',
          budget: 200.0,
          qty: 1000.0,
          strategyId: 1,
          netProfit: 25.0,
          entryPrice: 0.2,
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Orders fetched successfully'
      );
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should return correct response structure for error request', async () => {
      (prisma.order.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Failed to fetch orders');
      expect(response.body).not.toHaveProperty('data');
    });
  });
});
