import { prisma } from '../prisma.js';
import { Role } from '@prisma/client';

export interface BoardAccessResult {
    hasAccess: boolean;
    role?: Role | 'OWNER';
    board?: any;
    error?: { status: number; message: string };
}

/**
 * Validates whether a user has sufficient permissions for a board.
 * - OWNER has full control.
 * - EDITOR can read and mutate columns/tasks.
 * - VIEWER can only read.
 */
export async function checkBoardPermission(
    userId: string,
    boardId: string,
    requiredRole: 'VIEWER' | 'EDITOR' = 'VIEWER'
): Promise<BoardAccessResult> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
            members: {
                where: { userId },
            },
        },
    });

    if (!board) {
        return {
            hasAccess: false,
            error: { status: 404, message: 'Board not found' },
        };
    }

    // Owner has highest access
    if (board.ownerId === userId) {
        return { hasAccess: true, role: 'OWNER', board };
    }

    // Check membership role
    const membership = board.members[0];
    if (!membership) {
        return {
            hasAccess: false,
            error: { status: 403, message: 'Forbidden: You do not have access to this board' },
        };
    }

    if (requiredRole === 'EDITOR' && membership.role === Role.VIEWER) {
        return {
            hasAccess: false,
            role: Role.VIEWER,
            error: { status: 403, message: 'Forbidden: Viewers cannot modify board contents' },
        };
    }

    return { hasAccess: true, role: membership.role, board };
}
