import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/ofrecidas', authMiddleware, inventarioController.agregarCartaOfrecida);
router.post('/deseadas', authMiddleware, inventarioController.agregarCartaDeseada);

export default router;