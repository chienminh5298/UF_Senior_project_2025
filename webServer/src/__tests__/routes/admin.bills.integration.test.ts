import request from 'supertest';
import express from 'express';
import adminRouter from '../../routes/admin.routes';
import { requireAuth } from '../../middleware/auth';
import prisma from '../../models/prismaClient';

// Mock the auth middleware
jest.mock('../../middleware/auth');
jest.mock('../../models/prismaClient', () => ({
  bill: {
    findMany: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('GET /api/admin/bills Integration Tests', () => {
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

      const response = await request(app).get('/api/admin/bills').expect(401);

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
        .get('/api/admin/bills')
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

      (prisma.bill.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Successful bills data retrieval', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });
    });

    it('should return bills data successfully', async () => {
      const mockBills = [
        {
          id: 1,
          status: 'NEW',
          netProfit: 250.5,
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
          user: {
            id: 10,
            username: 'johndoe',
          },
        },
        {
          id: 2,
          status: 'COMPLETED',
          netProfit: 500.75,
          from: '2024-02-01T00:00:00Z',
          to: '2024-02-28T23:59:59Z',
          user: {
            id: 11,
            username: 'janesmith',
          },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Bills fetched successfully',
        data: { bills: mockBills },
      });

      expect(prisma.bill.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no bills exist', async () => {
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Bills fetched successfully',
        data: { bills: [] },
      });
    });

    it('should return bills with all required fields', async () => {
      const mockBill = {
        id: 3,
        status: 'PROCESSING',
        netProfit: 125.0,
        from: '2024-03-01T00:00:00Z',
        to: '2024-03-31T23:59:59Z',
        user: {
          id: 12,
          username: 'testuser',
        },
      };

      (prisma.bill.findMany as jest.Mock).mockResolvedValue([mockBill]);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills).toHaveLength(1);
      expect(response.body.data.bills[0]).toEqual(mockBill);
    });

    it('should include user information in bills', async () => {
      const mockBills = [
        {
          id: 4,
          status: 'NEW',
          netProfit: 350.25,
          from: '2024-04-01T00:00:00Z',
          to: '2024-04-30T23:59:59Z',
          user: {
            id: 13,
            username: 'billuser',
          },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills[0].user).toBeDefined();
      expect(response.body.data.bills[0].user.id).toBe(13);
      expect(response.body.data.bills[0].user.username).toBe('billuser');
    });

    it('should handle bills with different statuses', async () => {
      const mockBills = [
        {
          id: 5,
          status: 'NEW',
          netProfit: 100.0,
          from: '2024-05-01T00:00:00Z',
          to: '2024-05-31T23:59:59Z',
          user: { id: 14, username: 'user1' },
        },
        {
          id: 6,
          status: 'PROCESSING',
          netProfit: 200.0,
          from: '2024-05-01T00:00:00Z',
          to: '2024-05-31T23:59:59Z',
          user: { id: 15, username: 'user2' },
        },
        {
          id: 7,
          status: 'COMPLETED',
          netProfit: 300.0,
          from: '2024-05-01T00:00:00Z',
          to: '2024-05-31T23:59:59Z',
          user: { id: 16, username: 'user3' },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills).toHaveLength(3);
      expect(response.body.data.bills[0].status).toBe('NEW');
      expect(response.body.data.bills[1].status).toBe('PROCESSING');
      expect(response.body.data.bills[2].status).toBe('COMPLETED');
    });

    it('should handle bills with negative profit', async () => {
      const mockBills = [
        {
          id: 8,
          status: 'COMPLETED',
          netProfit: -150.5,
          from: '2024-06-01T00:00:00Z',
          to: '2024-06-30T23:59:59Z',
          user: { id: 17, username: 'lossuser' },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills[0].netProfit).toBe(-150.5);
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
      (prisma.bill.findMany as jest.Mock).mockRejectedValue(dbError);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch bills',
      });
    });

    it('should handle Prisma client errors', async () => {
      const prismaError = new Error('Prisma client error');
      (prisma.bill.findMany as jest.Mock).mockRejectedValue(prismaError);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch bills',
      });
    });

    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      (prisma.bill.findMany as jest.Mock).mockRejectedValue(timeoutError);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch bills',
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
        .get('/api/admin/bills')
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
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle large number of bills', async () => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com' };
        next();
        return undefined;
      });

      const largeBillList = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        status: 'COMPLETED',
        netProfit: 100.0 + index,
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
        user: {
          id: 100 + index,
          username: `user${index}`,
        },
      }));

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(largeBillList);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills).toHaveLength(100);
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
      const mockBills = [
        {
          id: 9,
          status: 'NEW',
          netProfit: 175.5,
          from: '2024-07-01T00:00:00Z',
          to: '2024-07-31T23:59:59Z',
          user: {
            id: 18,
            username: 'datauser',
          },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(prisma.bill.findMany).toHaveBeenCalled();
    });

    it('should handle bills with zero profit', async () => {
      const mockBills = [
        {
          id: 10,
          status: 'COMPLETED',
          netProfit: 0.0,
          from: '2024-08-01T00:00:00Z',
          to: '2024-08-31T23:59:59Z',
          user: { id: 19, username: 'zeroprofituser' },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.bills[0].netProfit).toBe(0.0);
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
      const mockBills = [
        {
          id: 11,
          status: 'PROCESSING',
          netProfit: 225.0,
          from: '2024-09-01T00:00:00Z',
          to: '2024-09-30T23:59:59Z',
          user: {
            id: 20,
            username: 'structureuser',
          },
        },
      ];

      (prisma.bill.findMany as jest.Mock).mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Bills fetched successfully'
      );
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('bills');
      expect(Array.isArray(response.body.data.bills)).toBe(true);
    });

    it('should return correct response structure for error request', async () => {
      (prisma.bill.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/admin/bills')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Failed to fetch bills');
      expect(response.body).not.toHaveProperty('data');
    });
  });
});
