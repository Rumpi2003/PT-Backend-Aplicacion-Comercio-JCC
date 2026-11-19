import { Router } from 'express';
import { tcgApiController } from '../controllers/tcgApi.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /tcgApi/listar_tcgs:
 *   get:
 *     summary: Listar los juegos de cartas (TCG) disponibles en la API externa
 *     tags:
 *       - TCG API
 *     responses:
 *       200:
 *         description: Listado de TCG obtenido con éxito
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       502:
 *         description: Error al consultar la API externa
 *       500:
 *         description: Error interno del servidor
 */
router.get('/listar_tcgs', authMiddleware, tcgApiController.listarTcgs);

/**
 * @openapi
 * /tcgApi/listar_sets:
 *   get:
 *     summary: Listar las colecciones (sets) de un TCG
 *     tags:
 *       - TCG API
 *     parameters:
 *       - in: query
 *         name: tcg
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, release_date]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Listado de sets obtenido con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       502:
 *         description: Error al consultar la API externa
 *       500:
 *         description: Error interno del servidor
 */
router.get('/listar_sets', authMiddleware, tcgApiController.listarSets);

/**
 * @openapi
 * /tcgApi/buscar:
 *   get:
 *     summary: Buscar cartas por nombre en la API externa
 *     tags:
 *       - TCG API
 *     parameters:
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tcg_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: set_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name]
 *           default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 999
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Cartas encontradas con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       502:
 *         description: Error al consultar la API externa
 *       500:
 *         description: Error interno del servidor
 */
router.get('/buscar', authMiddleware, tcgApiController.buscarPorNombre);

export default router;