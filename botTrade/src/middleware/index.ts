import { NextFunction, Request, Response } from "express";

export interface CustomRequest extends Request {
    userId?: number;
}

export const isAuthorization = (req: CustomRequest, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (!token || token !== process.env.AUTH_ADMIN_FRONTEND) {
        res.status(401).json({ message: "Unauthorized: Missing token" });
    } else {
        next();
    }
};
