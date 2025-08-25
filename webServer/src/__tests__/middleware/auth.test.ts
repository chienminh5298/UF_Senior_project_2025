import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../../middleware/auth';

jest.mock('jsonwebtoken');

describe('requireAuth middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    
    (jwt.verify as jest.Mock).mockReset();
  });

  describe('when no authorization header', () => {
    it('should return 401 with "Unauthorized" message', () => {
      mockRequest.headers = {};

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when authorization header is malformed', () => {
    it('should return 401 with "No token provided" message', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer is missing', () => {
      mockRequest.headers = { authorization: 'token123' };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
    });
  });

  describe('when JWT_SECRET is missing', () => {
    it('should return 500 with "Server configuration error" message', () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      mockRequest.headers = { authorization: 'Bearer validtoken' };

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server configuration error'
      });

      // Restore environment variable
      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe('when JWT verification fails', () => {
    it('should return 401 with "Invalid Token" message', () => {
      process.env.JWT_SECRET = 'test-secret';
      mockRequest.headers = { authorization: 'Bearer invalidtoken' };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid Token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when JWT verification succeeds', () => {
    it('should call next() and set req.user', () => {
      process.env.JWT_SECRET = 'test-secret';
      mockRequest.headers = { authorization: 'Bearer validtoken' };

      const mockUser = { id: 1, email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockUser);

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
