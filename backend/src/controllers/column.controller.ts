import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';
import { checkBoardPermission } from '../middlewares/permission.helper.js';
import { z } from 'zod';

const createColumnSchema = z.object({
    boardId: z.string().uuid('Invalid board ID'),
    title: z.string().min(1, 'Column title is required'),
});

const updateColumnSchema = z.object({
    title: z.string().min(1).optional(),
    order: z.number().optional(),
});

/**
 * POST /api/columns
 * Creates a new column at the end of a board
 */
export const createColumn = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { boardId, title } = createColumnSchema.parse(req.body);

        // Authorization check: User must be OWNER or EDITOR of this board
        const permission = await checkBoardPermission(userId, boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        // Determine the next order index (placing new column at the end)
        const lastColumn = await prisma.column.findFirst({
            where: { boardId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const nextOrder = lastColumn ? lastColumn.order + 1000 : 1000;

        const column = await prisma.column.create({
            data: {
                title,
                boardId,
                order: nextOrder,
            },
            include: {
                tasks: true,
            },
        });

        return res.status(201).json(column);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

/**
 * PATCH /api/columns/:id
 * Updates column title or column order
 */
export const updateColumn = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const columnId = req.params.id as string;
        const { title, order } = updateColumnSchema.parse(req.body);

        // Find the column to locate its boardId
        const column = await prisma.column.findUnique({ where: { id: columnId } });
        if (!column) {
            return res.status(404).json({ message: 'Column not found' });
        }

        // Check if user has EDITOR permissions on this board
        const permission = await checkBoardPermission(userId, column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        const updated = await prisma.column.update({
            where: { id: columnId },
            data: {
                ...(title !== undefined && { title }),
                ...(order !== undefined && { order }),
            },
        });

        return res.json(updated);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

/**
 * DELETE /api/columns/:id
 * Deletes a column and all its associated tasks (handled by Prisma cascade onDelete)
 */
export const deleteColumn = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const columnId = req.params.id as string;

        const column = await prisma.column.findUnique({ where: { id: columnId } });
        if (!column) {
            return res.status(404).json({ message: 'Column not found' });
        }

        // Check if user has EDITOR permissions
        const permission = await checkBoardPermission(userId, column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        await prisma.column.delete({
            where: { id: columnId },
        });

        return res.json({ message: 'Column deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
