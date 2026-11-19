import { Router } from 'express';
import { emparejamientoController } from '../controllers/emparejamiento.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /emparejamientos:
 *   get:
 *     summary: Obtener usuarios compatibles para intercambio
 *     tags:
 *       - Emparejamientos
 *     parameters:
 *       - in: query
 *         name: usarGeolocalizacion
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: soloMiComuna
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Emparejamientos obtenidos con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       409:
 *         description: Se solicitó geolocalización sin tener el modo activado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, emparejamientoController.obtenerEmparejamientos);

export default router;
