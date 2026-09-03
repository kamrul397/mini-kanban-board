import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';
import { checkBoardPermission } from '../middlewares/permission.helper.js';
import { z } from 'zod';

const createBoardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
});

const updateBoardSchema = z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().nullable().optional(),
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

        // Verify requesting user has Editor or Owner permissions
        const access = await checkBoardPermission(userId, boardId, 'EDITOR');
        if (!access.hasAccess) {
            return res.status(access.error?.status || 403).json({
                message: access.error?.message || 'Only board owners and editors can share this board',
            });
        }

        // Find the user to share with
        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        if (targetUser.id === userId) {
            return res.status(400).json({ message: 'You cannot share the board with yourself' });
        }

        // Check if user is already a member of this board
        const existingMember = await prisma.boardMember.findUnique({
            where: {
                boardId_userId: { boardId, userId: targetUser.id },
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        const displayName = targetUser.name || targetUser.email;
        const roleLabel = role === 'EDITOR' ? 'Editor' : 'Viewer';

        if (existingMember) {
            // Case A: User already has the exact role requested
            if (existingMember.role === role) {
                return res.status(400).json({
                    message: `${displayName} is already a member of this board with the ${roleLabel} role.`,
                });
            }

            // Case B: User exists with a different role -> update and provide clear feedback
            const updatedMembership = await prisma.boardMember.update({
                where: { id: existingMember.id },
                data: { role },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            return res.json({
                message: `${displayName} was already a member; their role has been updated to ${roleLabel}.`,
                membership: updatedMembership,
            });
        }

        // Case C: New member -> create membership record
        const membership = await prisma.boardMember.create({
            data: {
                boardId,
                userId: targetUser.id,
                role,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(201).json({
            message: `Board shared with ${displayName} as ${roleLabel}!`,
            membership,
        });
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

const updateMemberRoleSchema = z.object({
    role: z.enum(['VIEWER', 'EDITOR']),
});

// 5. Update member role (Owner only)
export const updateBoardMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;
        const memberId = req.params.memberId as string;
        const { role } = updateMemberRoleSchema.parse(req.body);

        const board = await prisma.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.ownerId !== userId) {
            return res.status(403).json({ message: 'Only the board owner can change member roles' });
        }

        const updatedMembership = await prisma.boardMember.update({
            where: { id: memberId },
            data: { role },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.json({ message: 'Member role updated successfully', membership: updatedMembership });
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

// 6. Remove member from board (Owner only, or member leaving)
export const removeBoardMember = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;
        const memberId = req.params.memberId as string;

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { members: true },
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const membership = board.members.find((m) => m.id === memberId);
        if (!membership) {
            return res.status(404).json({ message: 'Member not found on this board' });
        }

        // Only board owner OR the member themselves can remove
        if (board.ownerId !== userId && membership.userId !== userId) {
            return res.status(403).json({ message: 'Forbidden: Only the board owner can remove members' });
        }

        await prisma.boardMember.delete({
            where: { id: memberId },
        });

        return res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

// 5. Update Board title and description (Owner or Editor)
export const updateBoard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;
        const { title, description } = updateBoardSchema.parse(req.body);

        // Access Control check: User must be OWNER or EDITOR of this board
        const permission = await checkBoardPermission(userId, boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        const updatedBoard = await prisma.board.update({
            where: { id: boardId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
            },
        });

        return res.json(updatedBoard);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

// 6. Delete Board (Owner only)
export const deleteBoard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const boardId = req.params.id as string;

        const board = await prisma.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.ownerId !== userId) {
            return res.status(403).json({ message: 'Only the board owner can delete this board' });
        }

        await prisma.board.delete({
            where: { id: boardId },
        });

        return res.json({ message: 'Board deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

