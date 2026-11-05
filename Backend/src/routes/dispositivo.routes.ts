import { Router } from 'express';
import { dispositivoController } from '../controllers/dispositivo.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, dispositivoController.registrar);
router.delete('/', authMiddleware, dispositivoController.eliminar);

export default router;
