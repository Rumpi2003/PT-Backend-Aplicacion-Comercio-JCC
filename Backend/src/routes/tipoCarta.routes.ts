import { Router } from 'express';
import { tcgApiController } from '../controllers/tcgApi.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/buscar', authMiddleware, tcgApiController.buscarPorNombre);

export default router;