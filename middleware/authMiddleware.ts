import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

interface IRequest extends Request {
    user?: any;
}

export const protect = async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const user = await User.findOne({ jwtSecret: token });

            if (user) {
                req.user = user;
                next();
            } else {
                res.status(401).json({ error: 'Not authorized, token failed' });
            }
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};
