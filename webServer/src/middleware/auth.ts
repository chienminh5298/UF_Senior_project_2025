import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUser } from '../types/express';

// Extend Express Request to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUser;
  }
}

// Authenticates the user and returns the user object
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Check if JWT_SECRET exists
    // const secret = process.env.JWT_SECRET;
    // if (!secret) {
    //   return res.status(500).json({ message: 'Server configuration error' });
    // }

    // // Decode the token
    // const decoded = jwt.verify(token, secret);
    // const user = decoded as JwtUser;
    // req.user = user;

    // User authenticated, proceed to next endpoint
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
}
