import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { resenaController } from '../controllers/resena.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/perfil_personal', authMiddleware, usuarioController.getPerfilPersonal);

router.put('/descripcion', authMiddleware, usuarioController.updateDescripcion);

router.put('/comuna', authMiddleware, usuarioController.updateComuna);

router.put('/radio_geo', authMiddleware, usuarioController.updateRadioGeo);

router.put('/visibilidad_perfil', authMiddleware, usuarioController.updateVisibilidadPerfil);

router.get('/modo_geo', authMiddleware, usuarioController.getModoGeo);

router.put('/modo_geo', authMiddleware, usuarioController.updateModoGeo);

router.put('/ubicacion', authMiddleware, usuarioController.updateUbicacion);

// Perfil público; las rutas con parámetro van al final para no tapar las rutas fijas de arriba
router.get('/:idUsuario/resenas', authMiddleware, resenaController.listarRecibidas);
router.get('/:idUsuario', authMiddleware, usuarioController.getPerfilPublico);

export default router;