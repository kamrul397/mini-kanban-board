import { Router } from 'express';
import {
    createColumn,
    updateColumn,
    deleteColumn,
} from '../controllers/column.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createColumn);
router.patch('/:id', updateColumn);
router.delete('/:id', deleteColumn);

export default router;
