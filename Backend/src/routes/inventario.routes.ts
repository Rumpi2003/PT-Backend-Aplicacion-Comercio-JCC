import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/ofrecidas', authMiddleware, inventarioController.agregarCartaOfrecida);
router.post('/deseadas', authMiddleware, inventarioController.agregarCartaDeseada);
router.get('/ofrecidas', authMiddleware, inventarioController.obtenerInventario);
router.get('/deseadas', authMiddleware, inventarioController.obtenerListaDeseos);
router.patch('/ofrecidas/:id_carta_ofrecida', authMiddleware, inventarioController.modificarCartaOfrecida);
router.delete('/ofrecidas/:id_carta_ofrecida', authMiddleware, inventarioController.eliminarCartaOfrecida);
router.patch('/deseadas/:id_carta_deseada', authMiddleware, inventarioController.modificarCartaDeseada);
router.delete('/deseadas/:id_carta_deseada', authMiddleware, inventarioController.eliminarCartaDeseada);

export default router;