import { Router } from 'express';
import { transaccionController } from '../controllers/transaccion.controller.js';
import { mensajeController } from '../controllers/mensaje.controller.js';
import { reporteController } from '../controllers/reporte.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /transacciones:
 *   get:
 *     summary: Listar transacciones activas o historial
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: query
 *         name: vista
 *         schema:
 *           type: string
 *           enum: [activas, historial]
 *           default: activas
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [EN_NEGOCIACION, RECHAZADA, PENDIENTE, COMPLETADA, CANCELADA]
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
 *         description: Transacciones obtenidas con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, transaccionController.listarTransacciones);

/**
 * @openapi
 * /transacciones/contraparte/{idUsuario}/inventario:
 *   get:
 *     summary: Ver el inventario ofrecido de la contraparte de una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventario de la contraparte obtenido con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/contraparte/:idUsuario/inventario', authMiddleware, transaccionController.obtenerInventarioContraparte);

/**
 * @openapi
 * /transacciones/contraparte/{idUsuario}/mi-inventario:
 *   get:
 *     summary: Ver mi inventario relevante para una contraparte
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventario obtenido con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/contraparte/:idUsuario/mi-inventario', authMiddleware, transaccionController.obtenerMiInventario);

/**
 * @openapi
 * /transacciones/{idTransaccion}:
 *   get:
 *     summary: Obtener el detalle de una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transacción obtenida con éxito
 *       400:
 *         description: Parámetro inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:idTransaccion', authMiddleware, transaccionController.obtenerTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/mensajes:
 *   get:
 *     summary: Listar los mensajes de una transacción
 *     description: Los parámetros antes y despues son mutuamente excluyentes.
 *     tags:
 *       - Mensajes
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: antes
 *         schema:
 *           type: integer
 *         description: Obtiene mensajes anteriores a este ID
 *       - in: query
 *         name: despues
 *         schema:
 *           type: integer
 *         description: Obtiene mensajes posteriores a este ID
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Mensajes obtenidos con éxito
 *       400:
 *         description: Parámetros inválidos o usados a la vez
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:idTransaccion/mensajes', authMiddleware, mensajeController.listarMensajes);

/**
 * @openapi
 * /transacciones/{idTransaccion}/mensajes/leidos:
 *   patch:
 *     summary: Marcar los mensajes de una transacción como leídos
 *     tags:
 *       - Mensajes
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hasta_id_mensaje:
 *                 type: integer
 *                 description: Marca como leídos los mensajes hasta este ID. Si se omite, se marcan todos.
 *     responses:
 *       200:
 *         description: Mensajes marcados como leídos
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:idTransaccion/mensajes/leidos', authMiddleware, mensajeController.marcarLeidos);

/**
 * @openapi
 * /transacciones:
 *   post:
 *     summary: Crear una propuesta de transacción
 *     tags:
 *       - Transacciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario_destino
 *               - solicitadas
 *             properties:
 *               id_usuario_destino:
 *                 type: integer
 *               solicitadas:
 *                 type: array
 *                 minItems: 1
 *                 description: Cartas de la contraparte que deseo
 *                 items:
 *                   $ref: '#/components/schemas/ItemTransaccion'
 *               ofrecidas:
 *                 type: array
 *                 default: []
 *                 description: Cartas mías que ofrezco a cambio. Un mismo id_carta_ofrecida no puede repetirse.
 *                 items:
 *                   $ref: '#/components/schemas/ItemTransaccion'
 *     responses:
 *       201:
 *         description: Transacción creada con éxito
 *       400:
 *         description: Datos inválidos o intento de transaccionar consigo mismo
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario o carta no encontrada
 *       409:
 *         description: Carta duplicada o no disponible
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authMiddleware, transaccionController.crearTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/cancelar:
 *   patch:
 *     summary: Cancelar una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transacción cancelada con éxito
 *       400:
 *         description: Estado de la transacción no permite cancelar
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:idTransaccion/cancelar', authMiddleware, transaccionController.cancelarTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/contraoferta:
 *   put:
 *     summary: Enviar una contraoferta a una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
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
 *               - solicitadas
 *             properties:
 *               solicitadas:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/ItemTransaccion'
 *               ofrecidas:
 *                 type: array
 *                 default: []
 *                 items:
 *                   $ref: '#/components/schemas/ItemTransaccion'
 *     responses:
 *       200:
 *         description: Contraoferta enviada con éxito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       409:
 *         description: Estado de la transacción no permite contraofertar
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:idTransaccion/contraoferta', authMiddleware, transaccionController.contraofertar);

/**
 * @openapi
 * /transacciones/{idTransaccion}/aceptar:
 *   patch:
 *     summary: Aceptar una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transacción aceptada con éxito
 *       400:
 *         description: Estado de la transacción no permite aceptar
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:idTransaccion/aceptar', authMiddleware, transaccionController.aceptarTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/rechazar:
 *   patch:
 *     summary: Rechazar una transacción
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transacción rechazada con éxito
 *       400:
 *         description: Estado de la transacción no permite rechazar
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:idTransaccion/rechazar', authMiddleware, transaccionController.rechazarTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/completar:
 *   patch:
 *     summary: Confirmar la completitud de una transacción
 *     description: Registra la confirmación de quien la ejecuta. Cuando ambas partes confirman, la transacción pasa a COMPLETADA.
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Confirmación registrada, o transacción completada si ambas partes confirmaron
 *       400:
 *         description: Estado de la transacción no permite completar
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:idTransaccion/completar', authMiddleware, transaccionController.completarTransaccion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/completar:
 *   delete:
 *     summary: Retirar mi confirmación de completitud
 *     tags:
 *       - Transacciones
 *     parameters:
 *       - in: path
 *         name: idTransaccion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Confirmación retirada con éxito
 *       400:
 *         description: No existe una confirmación que retirar
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:idTransaccion/completar', authMiddleware, transaccionController.retirarConfirmacion);

/**
 * @openapi
 * /transacciones/{idTransaccion}/reportes:
 *   post:
 *     summary: Reportar una transacción
 *     tags:
 *       - Reportes
 *     parameters:
 *       - in: path
 *         name: idTransaccion
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
 *               - motivo
 *               - descripcion_reporte
 *             properties:
 *               motivo:
 *                 type: string
 *                 enum: [CARTAS_FALSAS, ESTADO_ERRONEO, INFORMACION_FALSA, NO_APARECE, ESTAFA, CANCELACION_REPETITIVA, ACOSO_CHAT, CONDUCTA_PELIGROSA, LUGAR_INSEGURO, SPAM, SUPLANTACION, OTRO]
 *               descripcion_reporte:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *     responses:
 *       201:
 *         description: Reporte creado con éxito
 *       400:
 *         description: Datos inválidos o intento de reportarse a sí mismo
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida o sin acceso a la transacción
 *       404:
 *         description: Transacción no encontrada
 *       409:
 *         description: Plazo para reportar vencido o reporte duplicado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:idTransaccion/reportes', authMiddleware, reporteController.reportarTransaccion);

export default router;
