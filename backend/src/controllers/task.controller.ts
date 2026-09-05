import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';
import { checkBoardPermission } from '../middlewares/permission.helper.js';
import { z } from 'zod';

const createTaskSchema = z.object({
    columnId: z.string().uuid('Invalid column ID'),
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
});

const moveTaskSchema = z.object({
    targetColumnId: z.string().uuid('Invalid target column ID'),
    // The client can provide:
    // 1. targetOrder directly (float)
    // 2. positionIndex or position (0-based index in target column)
    // 3. prevTaskId/nextTaskId to calculate midpoint
    targetOrder: z.number().optional(),
    positionIndex: z.number().int().min(0).optional(),
    position: z.number().int().min(0).optional(),
    prevTaskId: z.string().uuid().optional().nullable(),
    nextTaskId: z.string().uuid().optional().nullable(),
});

/**
 * POST /api/tasks
 * Create a new task at the end of a column
 */
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { columnId, title, description } = createTaskSchema.parse(req.body);

        // Find the column to get boardId
        const column = await prisma.column.findUnique({ where: { id: columnId } });
        if (!column) {
            return res.status(404).json({ message: 'Column not found' });
        }

        // Check permission (must be OWNER or EDITOR)
        const permission = await checkBoardPermission(userId, column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        // Find highest order in this column to place new task at the end
        const lastTask = await prisma.task.findFirst({
            where: { columnId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const nextOrder = lastTask ? lastTask.order + 1000 : 1000;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                columnId,
                order: nextOrder,
            },
        });

        return res.status(201).json(task);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

/**
 * PATCH /api/tasks/:id
 * Update task title and/or description
 */
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const taskId = req.params.id as string;
        const { title, description } = updateTaskSchema.parse(req.body);

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { column: true },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check permission
        const permission = await checkBoardPermission(userId, task.column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
            },
        });

        return res.json(updated);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const taskId = req.params.id as string;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { column: true },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const permission = await checkBoardPermission(userId, task.column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        return res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * PATCH /api/tasks/:id/move
 * Handles:
 * 1. Moving a task across different columns
 * 2. Reordering tasks within the same column
 * 3. Preserving order consistency using floating-point indexing
 */
export const moveTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const taskId = req.params.id as string;
        const { targetColumnId, targetOrder, positionIndex, position, prevTaskId, nextTaskId } = moveTaskSchema.parse(req.body);

        // Fetch the current task and its column
        const currentTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { column: true },
        });

        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Fetch target column
        const targetColumn = await prisma.column.findUnique({
            where: { id: targetColumnId },
        });

        if (!targetColumn) {
            return res.status(404).json({ message: 'Target column not found' });
        }

        // Security check: Must ensure target column belongs to the same board (no cross-board leaking!)
        if (currentTask.column.boardId !== targetColumn.boardId) {
            return res.status(400).json({ message: 'Cannot move tasks across different boards' });
        }

        // Check permission on board
        const permission = await checkBoardPermission(userId, currentTask.column.boardId, 'EDITOR');
        if (!permission.hasAccess) {
            return res.status(permission.error!.status).json({ message: permission.error!.message });
        }

        let newOrder: number;

        // Strategy A: If client explicitly passed a calculated targetOrder
        if (typeof targetOrder === 'number') {
            newOrder = targetOrder;
        }
        // Strategy B: If client passed a specific position index (0-based)
        else if (positionIndex !== undefined || position !== undefined) {
            const idx = positionIndex !== undefined ? positionIndex : position!;

            // Fetch existing tasks in target column (excluding the task being moved)
            const targetTasks = await prisma.task.findMany({
                where: {
                    columnId: targetColumnId,
                    id: { not: taskId },
                },
                orderBy: { order: 'asc' },
                select: { id: true, order: true },
            });

            if (targetTasks.length === 0) {
                // Column is empty
                newOrder = 1000;
            } else if (idx <= 0) {
                // Placed at the very top (index 0)
                newOrder = targetTasks[0].order / 2;
            } else if (idx >= targetTasks.length) {
                // Placed at or beyond the very bottom
                newOrder = targetTasks[targetTasks.length - 1].order + 1000;
            } else {
                // Placed between index - 1 and index
                const prevOrder = targetTasks[idx - 1].order;
                const nextOrder = targetTasks[idx].order;
                newOrder = (prevOrder + nextOrder) / 2;
            }
        }
        // Strategy C: Calculate order based on neighboring items (prevTaskId & nextTaskId)
        else {
            let prevOrder: number | null = null;
            let nextOrder: number | null = null;

            if (prevTaskId) {
                const prevTask = await prisma.task.findUnique({
                    where: { id: prevTaskId },
                    select: { order: true },
                });
                if (prevTask) prevOrder = prevTask.order;
            }

            if (nextTaskId) {
                const nextTask = await prisma.task.findUnique({
                    where: { id: nextTaskId },
                    select: { order: true },
                });
                if (nextTask) nextOrder = nextTask.order;
            }

            if (prevOrder !== null && nextOrder !== null) {
                // Insert between two items
                newOrder = (prevOrder + nextOrder) / 2;
            } else if (prevOrder !== null) {
                // Dropped at the very bottom
                newOrder = prevOrder + 1000;
            } else if (nextOrder !== null) {
                // Dropped at the very top
                newOrder = nextOrder / 2;
            } else {
                // Dropped into an empty column
                newOrder = 1000;
            }
        }

        // Execute update in database
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                columnId: targetColumnId,
                order: newOrder,
            },
        });

        return res.json({
            message: 'Task moved successfully',
            task: updatedTask,
        });
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ message: error.message });
    }
};
