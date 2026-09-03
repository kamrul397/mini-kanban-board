import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';
import { z } from 'zod';

const createBoardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
});

const shareBoardSchema = z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['VIEWER', 'EDITOR']).default('EDITOR'),
});

// 1. Create a new Board (and auto-create 3 default columns: To Do, In Progress, Done)
export const createBoard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { title, description } = createBoardSchema.parse(req.body);

        const board = await prisma.board.create({
            data: {
                title,
                description,
                ownerId: userId,
                // Pro-feature: auto-generate standard columns
                columns: {
                    create: [
                        { title: 'To Do', order: 0 },
                        { title: 'In Progress', order: 1 },
                        { title: 'Done', order: 2 },
                    ],
                },
            },
            include: {
                columns: true,
            },
        });

        return res.status(201).json(board);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

// 2. Get all boards the user owns OR is a member of
export const getMyBoards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;

        const boards = await prisma.board.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json(boards);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

// 3. Get single board by ID (with authorization check & ordered columns/tasks)
export const getBoardById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { include: { user: { select: { id: true, name: true, email: true } } } },
                columns: {
                    orderBy: { order: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Access Control check: Must be owner OR member
        const isOwner = board.ownerId === userId;
        const isMember = board.members.some((m) => m.userId === userId);

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this board' });
        }

        return res.json(board);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

// 4. Share Board with another registered user
export const shareBoard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;
        const { email, role } = shareBoardSchema.parse(req.body);

        // Verify requesting user is the board owner
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (board.ownerId !== userId) {
            return res.status(403).json({ message: 'Only the board owner can share this board' });
        }

        // Find the user to share with
        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        if (targetUser.id === userId) {
            return res.status(400).json({ message: 'You cannot share the board with yourself' });
        }

        // Upsert membership (create or update role)
        const membership = await prisma.boardMember.upsert({
            where: {
                boardId_userId: { boardId, userId: targetUser.id },
            },
            update: { role },
            create: {
                boardId,
                userId: targetUser.id,
                role,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.json({ message: 'Board shared successfully', membership });
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};
