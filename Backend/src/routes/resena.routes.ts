import { Router } from 'express';
import { resenaController } from '../controllers/resena.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:idUsuario/mia', authMiddleware, resenaController.obtenerMia);
router.put('/:idUsuario', authMiddleware, resenaController.guardar);

export default router;
