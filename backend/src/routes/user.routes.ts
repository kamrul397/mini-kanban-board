import { Router } from 'express';
import { getAllUsers } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getAllUsers);

export default router;
