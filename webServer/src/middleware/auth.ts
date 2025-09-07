import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Assuming JWT token is like this??
export interface JwtUser {
    id: number;
    email: string;
}

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtUser;
        }
    }
}

// Verifies that the user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header) { 
        return res.status(401).json({ message: 'Unauthorized' }); 
    }

    const [_, token] = header.split(' ');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        // Check if JWT_SECRET exists
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Decode the token
        const decoded = jwt.verify(token, secret);
        const user = decoded as JwtUser;
        req.user = user;

        // User authenticated, proceed to next endpoint
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
}