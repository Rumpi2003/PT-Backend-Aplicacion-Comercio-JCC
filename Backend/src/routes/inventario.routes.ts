import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /inventario/ofrecidas:
 *   post:
 *     summary: Agregar una carta al inventario ofrecido
 *     tags:
 *       - Inventario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_tipo_carta
 *               - estado
 *               - idioma
 *               - precio
 *               - cantidad
 *             properties:
 *               id_tipo_carta:
 *                 type: integer
 *               estado:
 *                 type: string
 *                 enum: [PERFECTA, RECIEN_ABIERTA, DESGASTE_MENOR, DESGASTE_VISIBLE, DESGASTE_SEVERO, DAÑADA, DESTRUIDA]
 *               idioma:
 *                 type: string
 *                 enum: [Inglés, Japonés, Español, Francés, Alemán, Italiano, Portugués, Coreano, Chino]
 *               precio:
 *                 type: integer
 *                 minimum: 0
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *     responses:
 *       200:
 *         description: Carta agregada al inventario
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Tipo de carta no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/ofrecidas', authMiddleware, inventarioController.agregarCartaOfrecida);

/**
 * @openapi
 * /inventario/deseadas:
 *   post:
 *     summary: Agregar una carta a la lista de deseos
 *     tags:
 *       - Inventario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_tipo_carta
 *             properties:
 *               id_tipo_carta:
 *                 type: integer
 *               estado_minimo:
 *                 type: string
 *                 enum: [PERFECTA, RECIEN_ABIERTA, DESGASTE_MENOR, DESGASTE_VISIBLE, DESGASTE_SEVERO, DAÑADA, DESTRUIDA]
 *               idioma:
 *                 type: string
 *                 enum: [Inglés, Japonés, Español, Francés, Alemán, Italiano, Portugués, Coreano, Chino]
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *     responses:
 *       200:
 *         description: Carta agregada a la lista de deseos
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Tipo de carta no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/deseadas', authMiddleware, inventarioController.agregarCartaDeseada);

/**
 * @openapi
 * /inventario/ofrecidas:
 *   get:
 *     summary: Obtener el inventario ofrecido del usuario
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nombre_carta, precio, franquicia]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Inventario obtenido con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/ofrecidas', authMiddleware, inventarioController.obtenerInventario);

/**
 * @openapi
 * /inventario/deseadas:
 *   get:
 *     summary: Obtener la lista de deseos del usuario
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nombre_carta, franquicia]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Lista de deseos obtenida con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/deseadas', authMiddleware, inventarioController.obtenerListaDeseos);

/**
 * @openapi
 * /inventario/ofrecidas/{id_carta_ofrecida}:
 *   patch:
 *     summary: Modificar una carta del inventario ofrecido
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id_carta_ofrecida
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PERFECTA, RECIEN_ABIERTA, DESGASTE_MENOR, DESGASTE_VISIBLE, DESGASTE_SEVERO, DAÑADA, DESTRUIDA]
 *               idioma:
 *                 type: string
 *                 enum: [Inglés, Japonés, Español, Francés, Alemán, Italiano, Portugués, Coreano, Chino]
 *               precio:
 *                 type: integer
 *                 minimum: 0
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *     responses:
 *       200:
 *         description: Carta modificada con éxito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o carta de otro usuario
 *       404:
 *         description: Carta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/ofrecidas/:id_carta_ofrecida', authMiddleware, inventarioController.modificarCartaOfrecida);

/**
 * @openapi
 * /inventario/ofrecidas/{id_carta_ofrecida}:
 *   delete:
 *     summary: Eliminar una carta del inventario ofrecido
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id_carta_ofrecida
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carta eliminada con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o carta de otro usuario
 *       404:
 *         description: Carta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/ofrecidas/:id_carta_ofrecida', authMiddleware, inventarioController.eliminarCartaOfrecida);

/**
 * @openapi
 * /inventario/deseadas/{id_carta_deseada}:
 *   patch:
 *     summary: Modificar una carta de la lista de deseos
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id_carta_deseada
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_minimo:
 *                 type: string
 *                 enum: [PERFECTA, RECIEN_ABIERTA, DESGASTE_MENOR, DESGASTE_VISIBLE, DESGASTE_SEVERO, DAÑADA, DESTRUIDA]
 *               idioma:
 *                 type: string
 *                 enum: [Inglés, Japonés, Español, Francés, Alemán, Italiano, Portugués, Coreano, Chino]
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *     responses:
 *       200:
 *         description: Carta deseada modificada con éxito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o carta de otro usuario
 *       404:
 *         description: Carta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/deseadas/:id_carta_deseada', authMiddleware, inventarioController.modificarCartaDeseada);

/**
 * @openapi
 * /inventario/deseadas/{id_carta_deseada}:
 *   delete:
 *     summary: Eliminar una carta de la lista de deseos
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id_carta_deseada
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carta eliminada con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o carta de otro usuario
 *       404:
 *         description: Carta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/deseadas/:id_carta_deseada', authMiddleware, inventarioController.eliminarCartaDeseada);

export default router;