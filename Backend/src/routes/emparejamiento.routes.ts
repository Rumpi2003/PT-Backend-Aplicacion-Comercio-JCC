import { Router } from 'express';
import { emparejamientoController } from '../controllers/emparejamiento.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, emparejamientoController.obtenerEmparejamientos);

export default router;
