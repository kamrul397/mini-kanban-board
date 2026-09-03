import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return res.json(users);
    } catch (err: any) {
        return res.status(500).json({ message: err.message || 'Failed to fetch users' });
    }
};
