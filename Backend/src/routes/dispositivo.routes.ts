import { Router } from 'express';
import { dispositivoController } from '../controllers/dispositivo.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /dispositivos:
 *   post:
 *     summary: Registrar el token de notificaciones push de un dispositivo
 *     tags:
 *       - Dispositivos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 512
 *     responses:
 *       201:
 *         description: Dispositivo registrado con éxito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authMiddleware, dispositivoController.registrar);

/**
 * @openapi
 * /dispositivos:
 *   delete:
 *     summary: Eliminar el token de notificaciones push de un dispositivo
 *     tags:
 *       - Dispositivos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 512
 *     responses:
 *       200:
 *         description: Dispositivo eliminado con éxito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Dispositivo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/', authMiddleware, dispositivoController.eliminar);

export default router;
