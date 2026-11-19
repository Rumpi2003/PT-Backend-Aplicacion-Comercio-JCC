import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware, requiereAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware, requiereAdmin);

/**
 * @openapi
 * /admin/reportes:
 *   get:
 *     summary: Listar reportes (solo administradores)
 *     tags:
 *       - Administración
 *     responses:
 *       200:
 *         description: Reportes obtenidos con éxito
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin rol de administrador
 *       500:
 *         description: Error interno del servidor
 */
router.get('/reportes', adminController.listarReportes);

/**
 * @openapi
 * /admin/reportes/{idReporte}:
 *   get:
 *     summary: Obtener el detalle de un reporte (solo administradores)
 *     tags:
 *       - Administración
 *     parameters:
 *       - in: path
 *         name: idReporte
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del reporte obtenido con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin rol de administrador
 *       404:
 *         description: Reporte no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/reportes/:idReporte', adminController.detalleReporte);

/**
 * @openapi
 * /admin/reportes/{idReporte}/estado:
 *   patch:
 *     summary: Cambiar el estado de un reporte (solo administradores)
 *     description: La resolución es obligatoria cuando el estado es SANCIONADO.
 *     tags:
 *       - Administración
 *     parameters:
 *       - in: path
 *         name: idReporte
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [DESESTIMADO, ARCHIVADO, SANCIONADO]
 *               resolucion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *     responses:
 *       200:
 *         description: Estado del reporte actualizado con éxito
 *       400:
 *         description: Datos inválidos o falta la resolución
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin rol de administrador
 *       404:
 *         description: Reporte no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/reportes/:idReporte/estado', adminController.cambiarEstadoReporte);

/**
 * @openapi
 * /admin/usuarios/{idUsuario}/suspension:
 *   delete:
 *     summary: Levantar la suspensión de un usuario (solo administradores)
 *     tags:
 *       - Administración
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suspensión levantada con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/usuarios/:idUsuario/suspension', adminController.levantarSuspension);

export default router;
