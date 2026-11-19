import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware, requiereAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware, requiereAdmin);

router.get('/reportes', adminController.listarReportes);
router.get('/reportes/:idReporte', adminController.detalleReporte);
router.patch('/reportes/:idReporte/estado', adminController.cambiarEstadoReporte);
router.delete('/usuarios/:idUsuario/suspension', adminController.levantarSuspension);

export default router;
