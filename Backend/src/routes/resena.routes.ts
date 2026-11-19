import { Router } from 'express';
import { resenaController } from '../controllers/resena.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /resenas/{idUsuario}/mia:
 *   get:
 *     summary: Obtener mi reseña sobre un usuario
 *     tags:
 *       - Reseñas
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reseña obtenida con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Reseña o usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:idUsuario/mia', authMiddleware, resenaController.obtenerMia);

/**
 * @openapi
 * /resenas/{idUsuario}:
 *   put:
 *     summary: Crear o actualizar mi reseña sobre un usuario
 *     description: Solo es posible si existe una transacción completada entre ambos usuarios. Responde 201 si se crea y 200 si se actualiza.
 *     tags:
 *       - Reseñas
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - puntuacion
 *             properties:
 *               puntuacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               cuerpo:
 *                 type: string
 *                 maxLength: 255
 *     responses:
 *       200:
 *         description: Reseña actualizada con éxito
 *       201:
 *         description: Reseña creada con éxito
 *       400:
 *         description: Datos inválidos o intento de reseñarse a sí mismo
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: No existe una transacción completada con este usuario
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:idUsuario', authMiddleware, resenaController.guardar);

export default router;
