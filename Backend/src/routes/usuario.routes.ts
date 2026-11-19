import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { resenaController } from '../controllers/resena.controller.js';
import { reporteController } from '../controllers/reporte.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /usuarios/perfil_personal:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags:
 *       - Usuarios
 *     responses:
 *       200:
 *         description: Perfil personal obtenido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/perfil_personal', authMiddleware, usuarioController.getPerfilPersonal);

/**
 * @openapi
 * /usuarios/descripcion:
 *   put:
 *     summary: Actualizar la descripción del perfil
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion_perfil
 *             properties:
 *               descripcion_perfil:
 *                 type: string
 *                 maxLength: 255
 *                 example: Coleccionista de cartas de Pokémon
 *     responses:
 *       200:
 *         description: Descripción actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/descripcion', authMiddleware, usuarioController.updateDescripcion);

/**
 * @openapi
 * /usuarios/comuna:
 *   put:
 *     summary: Cambiar la comuna del usuario
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_comuna
 *             properties:
 *               id_comuna:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Comuna actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/comuna', authMiddleware, usuarioController.updateComuna);

/**
 * @openapi
 * /usuarios/radio_geo:
 *   put:
 *     summary: Definir el radio geográfico de búsqueda (en metros)
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - radio_geo
 *             properties:
 *               radio_geo:
 *                 type: integer
 *                 minimum: 200
 *                 maximum: 2000
 *                 example: 500
 *     responses:
 *       200:
 *         description: Radio geográfico actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/radio_geo', authMiddleware, usuarioController.updateRadioGeo);

/**
 * @openapi
 * /usuarios/visibilidad_perfil:
 *   put:
 *     summary: Cambiar la visibilidad del perfil
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibilidad_perfil
 *             properties:
 *               visibilidad_perfil:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Visibilidad del perfil actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/visibilidad_perfil', authMiddleware, usuarioController.updateVisibilidadPerfil);

/**
 * @openapi
 * /usuarios/modo_geo:
 *   get:
 *     summary: Consultar si el modo geolocalizado está activado
 *     tags:
 *       - Usuarios
 *     responses:
 *       200:
 *         description: Estado del modo geolocalizado obtenido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/modo_geo', authMiddleware, usuarioController.getModoGeo);

/**
 * @openapi
 * /usuarios/modo_geo:
 *   put:
 *     summary: Activar o desactivar el modo geolocalizado
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modo_geo_activado
 *             properties:
 *               modo_geo_activado:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Modo geográfico activado o desactivado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/modo_geo', authMiddleware, usuarioController.updateModoGeo);

/**
 * @openapi
 * /usuarios/ubicacion:
 *   put:
 *     summary: Actualizar la ubicación geográfica del usuario
 *     description: Requiere tener activado el modo geolocalizado (ver PUT /usuarios/modo_geo)
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitud
 *               - longitud
 *             properties:
 *               latitud:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: -33.4489
 *               longitud:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -70.6693
 *     responses:
 *       200:
 *         description: Ubicación actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El modo geolocalizado no está activado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/ubicacion', authMiddleware, usuarioController.updateUbicacion);

// Perfil público; las rutas con parámetro van al final para no tapar las rutas fijas de arriba
/**
 * @openapi
 * /usuarios/{idUsuario}/resenas:
 *   get:
 *     summary: Listar las reseñas recibidas por un usuario
 *     tags:
 *       - Reseñas
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Reseñas obtenidas con éxito
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Cuenta suspendida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:idUsuario/resenas', authMiddleware, resenaController.listarRecibidas);

/**
 * @openapi
 * /usuarios/{idUsuario}/reportes:
 *   post:
 *     summary: Reportar a un usuario
 *     tags:
 *       - Reportes
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
 *         description: Cuenta suspendida
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Ya existe un reporte pendiente para este usuario
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:idUsuario/reportes', authMiddleware, reporteController.reportarUsuario);

/**
 * @openapi
 * /usuarios/{idUsuario}:
 *   get:
 *     summary: Obtener el perfil público de un usuario
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Perfil obtenido con éxito
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
router.get('/:idUsuario', authMiddleware, usuarioController.getPerfilPublico);

export default router;