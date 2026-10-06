import { Router } from 'express';
import { tcgApiController } from '../controllers/tcgApi.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/listar_tcgs', authMiddleware, tcgApiController.listarTcgs);
router.get('/listar_sets', authMiddleware, tcgApiController.listarSets);
router.get('/buscar', authMiddleware, tcgApiController.buscarPorNombre);

export default router;