import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/perfil_personal', authMiddleware, usuarioController.getPerfilPersonal);

router.put('/descripcion', authMiddleware, usuarioController.updateDescripcion);

router.put('/comuna', authMiddleware, usuarioController.updateComuna);

export default router;