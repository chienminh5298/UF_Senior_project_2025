import request from 'supertest';
import express from 'express';
import userRouter from '../../routes/user.routes';
import { requireAuth } from '../../middleware/auth';
import prisma from '../../models/prismaClient';
import { BillStatus, VoucherStatus } from '@prisma/client';

// Mock the auth middleware
jest.mock('../../middleware/auth');
jest.mock('../../models/prismaClient', () => ({
  bill: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  voucher: {
    findFirst: jest.fn(),
  },
  claim: {
    create: jest.fn(),
  },
}));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('POST /api/user/claim Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user', userRouter);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/user/claim')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(401);

      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequireAuth.mockImplementation((req, res) => {
        req.user = undefined;
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return res;
      });

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Unauthorized',
      });
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
        return res;
      });
    });

    it('should return 400 when billIds is empty', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing required fields',
      });
    });

    it('should return 400 when network is missing', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing required fields',
      });
    });

    it('should return 400 when address is missing', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing required fields',
      });
    });

    it('should return 400 when hashId is missing', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing required fields',
      });
    });
  });

  describe('Business Logic', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
        return res;
      });
    });

    it('should return 400 when no bills to claim (amount is 0)', async () => {
      // Mock bills with zero netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 0 },
        { id: 2, netProfit: 0 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No bills to claim',
      });
    });

    it('should create claim successfully when user has no active voucher', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
        { id: 2, netProfit: 50 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock claim creation
      const mockClaim = {
        id: 1,
        amount: 15, // (100 + 50) * 0.1
        network: 'ethereum',
        address: '0x123',
        hashId: 'hash123',
        userId: 1,
      };
      (prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim);

      // Mock bill updates
      (prisma.bill.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Claim created successfully',
        data: mockClaim,
      });

      // Verify claim was created with correct data
      expect(prisma.claim.create).toHaveBeenCalledWith({
        data: {
          amount: 15,
          bills: { connect: [{ id: 1 }, { id: 2 }] },
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
          userId: 1,
        },
      });

      // Verify bills were updated to CLAIMED status
      expect(prisma.bill.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { status: BillStatus.CLAIMED },
      });
    });

    it('should set amount to 0 when user has active voucher', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
        { id: 2, netProfit: 50 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        status: VoucherStatus.inuse,
      });

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No bills to claim',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      (prisma.bill.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1, 2],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to create claim',
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockRequireAuth.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
        return res;
      });
    });

    it('should handle empty billIds array', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing required fields',
      });
    });

    it('should handle missing user commission data', async () => {
      // Mock bills with positive netProfit
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([
        { id: 1, netProfit: 100 },
      ]);

      // Mock user data with null commission
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: null,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [1],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No bills to claim',
      });
    });

    it('should handle non-existent bills', async () => {
      // Mock empty bills result
      (prisma.bill.findMany as jest.Mock).mockResolvedValue([]);

      // Mock user data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        adminCommissionPercent: 0.1,
      });

      // Mock no active voucher
      (prisma.voucher.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({
          billIds: [999, 998],
          network: 'ethereum',
          address: '0x123',
          hashId: 'hash123',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No bills to claim',
      });
    });
  });
});
