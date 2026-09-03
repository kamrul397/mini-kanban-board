import { Router } from 'express';
import {
    createTask,
    updateTask,
    deleteTask,
    moveTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/move', moveTask);

export default router;
