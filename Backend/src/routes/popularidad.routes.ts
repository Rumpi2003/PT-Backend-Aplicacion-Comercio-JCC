import { Router } from 'express';
import { popularidadController } from '../controllers/popularidad.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, popularidadController.obtenerTop);

export default router;
