import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registro de un nuevo usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *               - nombre_usuario
 *               - id_comuna
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: usuario@correo.com
 *                 required: true
 *               contraseña:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 64
 *                 example: contraseñaSegura123.
 *                 required: true
 *               nombre_usuario:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 32
 *                 example: usuario123
 *                 required: true
 *               contacto:
 *                 type: string
 *                 format: phone
 *                 example: +56XXXXXXXXX
 *                 required: false
 *               descripcion_perfil:
 *                 type: string
 *                 minLength: 0
 *                 maxLength: 255
 *                 example: Descripción breve del perfil del usuario
 *                 required: false
 *               id_comuna:
 *                 type: integer
 *                 example: 123
 *                 required: true
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos [lista de campos con errores]
 *       409:
 *         description: Conflicto de datos (correo, nombre de usuario o contacto ya en uso)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/perfil', authMiddleware, (req, res) => {
    res.json({
        status: 'success',
        usuario: req.user
    });
});

export default router;