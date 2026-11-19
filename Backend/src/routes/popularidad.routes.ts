import { Router } from 'express';
import { popularidadController } from '../controllers/popularidad.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /popularidad:
 *   get:
 *     summary: Obtener el ranking de popularidad de usuarios
 *     tags:
 *       - Popularidad
 *     responses:
 *       200:
 *         description: Ranking obtenido con éxito
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, popularidadController.obtenerTop);

export default router;
