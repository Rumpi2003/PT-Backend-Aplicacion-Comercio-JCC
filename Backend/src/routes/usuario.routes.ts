import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/perfil_personal', authMiddleware, usuarioController.getPerfilPersonal);

router.put('/descripcion', authMiddleware, usuarioController.updateDescripcion);

router.put('/comuna', authMiddleware, usuarioController.updateComuna);

router.put('/radio_geo', authMiddleware, usuarioController.updateRadioGeo);

router.put('/visibilidad_perfil', authMiddleware, usuarioController.updateVisibilidadPerfil);

export default router;