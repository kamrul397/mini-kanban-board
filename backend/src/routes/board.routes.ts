import { Router } from 'express';
import {
    createBoard,
    getMyBoards,
    getBoardById,
    shareBoard,
} from '../controllers/board.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all board routes with JWT authentication
router.use(authenticate);

router.post('/', createBoard);
router.get('/', getMyBoards);
router.get('/:id', getBoardById);
router.post('/:id/share', shareBoard);

export default router;
