import { Router } from 'express';
import {
    createBoard,
    getMyBoards,
    getBoardById,
    updateBoard,
    shareBoard,
    deleteBoard,
    updateBoardMemberRole,
    removeBoardMember,
} from '../controllers/board.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all board routes with JWT authentication
router.use(authenticate);

router.post('/', createBoard);
router.get('/', getMyBoards);
router.get('/:id', getBoardById);
router.patch('/:id', updateBoard);
router.post('/:id/share', shareBoard);
router.patch('/:id/members/:memberId', updateBoardMemberRole);
router.delete('/:id/members/:memberId', removeBoardMember);
router.delete('/:id', deleteBoard);

export default router;
